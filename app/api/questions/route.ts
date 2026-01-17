import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'
import { translationService } from '@/lib/services/translation'
import { quotaService } from '@/lib/services/quota'

/**
 * POST /api/questions
 * Submit a new question
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { text, category = 'general' } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return createErrorResponse('Question text is required', 400)
    }

    if (text.length > 1000) {
      return createErrorResponse('Question text is too long (max 1000 characters)', 400)
    }

    // Validate category
    const validCategories = ['love', 'career', 'family', 'spiritual', 'money', 'general']
    if (!validCategories.includes(category)) {
      return createErrorResponse('Invalid category', 400)
    }

    const supabase = await createClient()

    // Get user's subscription plan (default to 'basic' if not set)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_plan')
      .eq('user_id', user.id)
      .single()

    const planType = (profile?.subscription_plan as 'basic' | 'spark' | 'flame' | 'superflame') || 'basic'

    // Check quota (but don't consume yet - will consume after answer is generated)
    const quotaValidation = await quotaService.validateQuota(user.id, planType)
    if (!quotaValidation.valid) {
      return createErrorResponse(quotaValidation.message || 'Daily quota exhausted', 429)
    }

    // Detect language
    const languageDetection = await translationService.detectLanguage(text.trim())
    const languageDetected = languageDetection.language

    // Translate to English for internal processing (if not English)
    let textInternalEn = text.trim()
    if (languageDetected !== 'en') {
      textInternalEn = await translationService.translateToEnglish(
        text.trim(),
        languageDetected
      )
    }

    // NOTE: Quota will be consumed in /api/questions/answer after answer is generated

    // Create question record
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        user_id: user.id,
        source: 'subscription', // Default to subscription source
        text_original: text.trim(),
        text_internal_en: textInternalEn,
        language_detected: languageDetected,
        category: category,
        status: 'pending',
      })
      .select()
      .single()

    if (questionError) {
      console.error('Error creating question:', questionError)
      return createErrorResponse('Failed to create question', 500)
    }

    return createSuccessResponse({
      question: {
        id: question.id,
        text: question.text_original,
        category: question.category,
        status: question.status,
        created_at: question.created_at,
        language_detected: question.language_detected,
      },
      quota: {
        remaining: quotaValidation.remaining,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/questions:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

/**
 * GET /api/questions
 * Get user's questions with answers
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get questions with email_sent_at (don't include answers - answers are sent via email only)
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        text_original,
        category,
        status,
        created_at,
        email_sent_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return createErrorResponse('Failed to fetch questions', 500)
    }

    return createSuccessResponse({
      questions: questions || [],
      total: questions?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/questions:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
