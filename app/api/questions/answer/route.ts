import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'
import { anythingLLMService } from '@/lib/services/anythingllm'
import { translationService } from '@/lib/services/translation'
import { quotaService } from '@/lib/services/quota'
import {
  fetchUserContext,
  generateImageSignedUrls,
  formatUserContextForLLM,
  extractPalmistryData, // 🔥 NEW: Extract actual palmistry features instead of generic vision labels
} from '@/lib/services/user-context'
import { scheduleEmailDelivery, getDeliveryDelay, generateAnswerEmail } from '@/lib/services/email'
import { voiceRSSTTSService } from '@/lib/services/voicerss-tts'

/**
 * POST /api/questions/answer
 * Generate answer for a question using AnythingLLM
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { question_id } = body

    if (!question_id) {
      return createErrorResponse('Question ID is required', 400)
    }

    const supabase = await createClient()

    // Get user's subscription plan (default to 'basic' if not set)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_plan')
      .eq('user_id', user.id)
      .single()

    const planType = (profile?.subscription_plan as 'basic' | 'spark' | 'flame' | 'superflame') || 'basic'

    // Get question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', question_id)
      .eq('user_id', user.id)
      .single()

    if (questionError || !question) {
      return createErrorResponse('Question not found', 404)
    }

    // Check if answer already exists
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('question_id', question_id)
      .single()

    if (existingAnswer) {
      return createErrorResponse('Answer already exists for this question', 400)
    }

    // Get user's AnythingLLM workspace (should already exist from registration)
    let { data: workspace, error: workspaceError } = await supabase
      .from('anythingllm_workspaces')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    // Only create workspace if it doesn't exist in DB at all (not if it's just missing in AnythingLLM)
    if (!workspace || !workspace.workspace_id || workspace.workspace_id === 'null' || workspace.workspace_id === 'undefined') {
      console.log(`Creating new workspace for user ${user.id} (no workspace in DB)`)
      try {
        // Get user name for workspace
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user.id)
          .single()

        const userName = userData?.name || userData?.email?.split('@')[0] || 'User'

        // Create new workspace
        const newWorkspaceId = await anythingLLMService.createWorkspace(user.id, userName)

        // Save to database
        if (workspace) {
          await supabase
            .from('anythingllm_workspaces')
            .update({ workspace_id: newWorkspaceId })
            .eq('user_id', user.id)
        } else {
          await supabase
            .from('anythingllm_workspaces')
            .insert({ user_id: user.id, workspace_id: newWorkspaceId })
        }

        workspace = { workspace_id: newWorkspaceId }
        console.log(`✅ Created and saved workspace: ${newWorkspaceId}`)
      } catch (createError) {
        console.error('Error creating workspace:', createError)
        return createErrorResponse(
          'Failed to create workspace. Please ensure AnythingLLM is running and API key is configured.',
          500
        )
      }
    } else {
      console.log(`✅ Using existing workspace from DB: ${workspace.workspace_id}`)
    }

    // Extract numeric ID from workspace_id (might be in format "id:slug" or just "id")
    let numericWorkspaceId = workspace.workspace_id
    if (workspace.workspace_id.includes(':')) {
      numericWorkspaceId = workspace.workspace_id.split(':')[0]
    }

    // Verify workspace exists in AnythingLLM (non-blocking - chat will handle if missing)
    // Only verify if we have a numeric ID
    if (/^\d+$/.test(numericWorkspaceId)) {
      const workspaceExists = await anythingLLMService.getWorkspace(numericWorkspaceId)
      if (!workspaceExists) {
        console.warn(`Workspace ${numericWorkspaceId} not found in AnythingLLM, but will use it anyway (chat will handle)`)
        // Don't recreate - use existing workspace ID, chat method will handle it
      } else {
        console.log(`✅ Workspace ${numericWorkspaceId} verified in AnythingLLM`)
      }
    } else {
      console.warn(`Workspace ID format might be invalid: ${workspace.workspace_id}, will use as-is`)
    }

    // Step 1: Fetch user context from database (direct injection, no RAG)
    const userContextData = await fetchUserContext(user.id)

    // Step 2: Extract structured palmistry data from palm images
    // 🔥 CRITICAL CHANGE: We now extract ACTUAL palmistry features (marriage lines, heart lines, etc.)
    // instead of generic computer vision labels ("Finger", "White", "Gesture")
    let palmDescriptions: Map<string, string> = new Map()
    if (userContextData.palmImages.length > 0) {
      try {
        console.log('[API] Extracting palmistry data from', userContextData.palmImages.length, 'palm images...')
        const imagesWithUrls = await generateImageSignedUrls(userContextData.palmImages)
        palmDescriptions = await extractPalmistryData(imagesWithUrls)
        console.log('[API] ✅ Palmistry extraction complete')
      } catch (error) {
        console.error('[API] Error extracting palmistry data:', error)
        // Continue without palm descriptions if analysis fails
      }
    }

    // Step 3: Format user context for LLM
    const userContextText = formatUserContextForLLM(userContextData, palmDescriptions)

    // Get recent Q&A history for context
    const { data: recentQuestions } = await supabase
      .from('questions')
      .select('text_original, answers(text)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Build chat history
    const chatHistory = []
    if (recentQuestions && recentQuestions.length > 0) {
      for (const q of recentQuestions.reverse()) {
        chatHistory.push({
          role: 'user' as const,
          content: q.text_original || '',
        })
        if (q.answers && q.answers.length > 0) {
          chatHistory.push({
            role: 'assistant' as const,
            content: q.answers[0].text || '',
          })
        }
      }
    }

    // Add current question to history
    chatHistory.push({
      role: 'user' as const,
      content: question.text_original || question.text_internal_en || '',
    })

    // Generate answer using AnythingLLM
    let answerText = ''
    let llmModelUsed = 'unknown'
    let tokensUsed = 0

    try {
      // Build enhanced system prompt with direct context injection
      const systemPrompt = `You are Aarav Dev, a wise and compassionate astrologer and palmistry expert. You are a real human palmist providing personalized readings to clients.

CRITICAL RESPONSE RULES:
- Answer ONLY what the user asked - nothing more, nothing less
- Keep responses SHORT: 4-6 concise sentences maximum
- NO greetings ("Dear...", "Hello...", etc.) - start directly with the answer
- NO closing lines, signatures, or farewells
- NO disclaimers like "for more accuracy consult an astrologer" or "this is just guidance"
- NO extra advice unless explicitly asked
- NO fancy language, summaries, or unrelated explanations
- Write in a normal conversational tone - as if speaking directly to the person
- Use "you" and "your" naturally
- Base your answer on the user's birth details and palm reading insights provided
- Be direct and to the point - answer the core question only

Example:
User: "How is the next one year looking for me?"
Good: "Based on your birth chart, the next year shows significant growth in your career. You'll see opportunities around mid-year that align with your natural talents. Financial stability will improve, especially in the second half. Relationships will deepen, and you may find new meaningful connections. Overall, it's a transformative period for you."

Bad: "Dear user, based on your palm reading and birth details, I can see that... [long explanation]... For more detailed analysis, please consult a professional astrologer. Best regards, Aarav Dev."

Remember: Answer the question directly, concisely, and naturally - like a palmist speaking to a client.`

      // Inject user context directly into the message for better reliability
      // Some LLM modes don't properly use system prompts, so we prepend context to message
      const userQuestion = question.text_original || question.text_internal_en || ''
      const messageWithContext = `USER CONTEXT INFORMATION:
${userContextText}

---
USER QUESTION: ${userQuestion}

Answer ONLY what the user asked. Keep it short (4-6 sentences), direct, and conversational. NO greetings, NO closing lines, NO disclaimers, NO extra advice. Just answer the question naturally based on their birth details and palm reading.`

      console.log(`📝 Sending message with context (${userContextText.length} chars of context)`)

      const response = await anythingLLMService.chat(
        workspace.workspace_id,
        messageWithContext, // Message with context prepended
        systemPrompt, // System prompt for persona
        chatHistory.slice(-20) // Last 20 messages
      )

      answerText = response.response || ''
      // Extract model info if available
      llmModelUsed = (response as any).model || 'anythingllm'
      tokensUsed = (response as any).tokens || 0

      // ✅ Consume quota ONLY after successful answer generation
      const quotaResult = await quotaService.consumeQuota(user.id, planType)
      if (!quotaResult.success) {
        // Answer generated but quota consumption failed - log but don't fail
        console.error('Answer generated but quota consumption failed:', quotaResult.error)
      } else {
        console.log('✅ Quota consumed. Remaining:', quotaResult.remaining)
      }
    } catch (error) {
      console.error('Error calling AnythingLLM:', error)

      // If workspace is invalid, return error (workspace should only be created on registration)
      if (error instanceof Error && (error.message.includes('not a valid workspace') || error.message.includes('recreate workspace') || error.message.includes('Invalid workspace ID'))) {
        return createErrorResponse(
          'Workspace is invalid. Please contact support or complete registration again.',
          500
        )
      } else if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        return createErrorResponse(
          'AnythingLLM service is not available. Please ensure Docker containers are running and configured.',
          503
        )
      } else if (error instanceof Error && (error.message.includes('LLM provider') || error.message.includes('fetch failed'))) {
        return createErrorResponse(
          'LLM provider is not configured in AnythingLLM. Please configure LLM provider in AnythingLLM settings (Settings → LLM Preference) and try again.',
          503
        )
      } else {
        throw error
      }
    }

    if (!answerText || answerText.trim().length === 0) {
      return createErrorResponse('Failed to generate answer', 500)
    }

    // Clean up answer: Remove any greetings, signatures, disclaimers, or closing phrases
    answerText = answerText
      // Remove greetings at start
      .replace(/^(Dear\s+[^,\n]+|Hello\s+[^,\n]+|Hi\s+[^,\n]+|Greetings\s*[,\n])/i, '')
      // Remove closing signatures and phrases
      .replace(/\n*(Best regards|Sincerely|Regards|Thank you|Thanks|Yours truly|Yours sincerely|Assistant Name|Aarav Dev|\[Assistant Name\]|\[Your Name\]).*$/i, '')
      .replace(/\n*---\s*\n*(Best regards|Sincerely|Regards|Thank you|Thanks).*$/i, '')
      .replace(/\n*^(Best regards|Sincerely|Regards|Thank you|Thanks|Assistant Name|\[Assistant Name\]).*$/im, '')
      // Remove common disclaimers
      .replace(/\n*(For more (detailed|accurate|precise) (analysis|guidance|consultation|reading),?\s*(please\s+)?(consult|see|visit|contact)\s+(a\s+)?(professional|expert|qualified)\s+(astrologer|palmist|palmistry expert|practitioner).*?)/i, '')
      .replace(/\n*(This is (just|only|merely) (a|an) (guidance|general|basic) (reading|analysis|prediction|insight).*?)/i, '')
      .replace(/\n*(Please note that.*?(consult|professional|expert).*?)/i, '')
      .replace(/\n*(For (better|more) (accuracy|precision|details).*?(consult|professional|expert).*?)/i, '')
      .trim()

    // Translate answer to user's language (if not English)
    const questionLanguage = question.language_detected || 'en'
    let answerTextTranslated = answerText
    let answerTextInternalEn = answerText

    if (questionLanguage !== 'en') {
      // Answer is in English, translate to user's language
      answerTextTranslated = await translationService.translateToLanguage(
        answerText,
        questionLanguage,
        'en'
      )
      answerTextInternalEn = answerText // Keep English version
    } else {
      // Answer is already in English
      answerTextInternalEn = answerText
      answerTextTranslated = answerText
    }

    // Save answer to database
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .insert({
        question_id: question.id,
        user_id: user.id,
        text: answerTextTranslated, // Translated to user's language
        text_internal_en: answerTextInternalEn, // English version
        llm_model_used: llmModelUsed,
        tokens_used: tokensUsed,
        safety_flags: {}, // TODO: Implement safety checks
        reviewed: false,
        flagged: false,
      })
      .select()
      .single()

    if (answerError) {
      console.error('Error saving answer:', answerError)
      return createErrorResponse('Failed to save answer', 500)
    }

    // Keep question status as 'pending' until email is sent
    // Status will be updated to 'sent' when email is delivered via /api/email/send

    // Get user email
    const { data: userData } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', user.id)
      .single()

    const userEmail = userData?.email || ''
    const userName = userData?.name || undefined

    // Generate voice for Flame and SuperFlame plans using VoiceRSS
    let audioUrl: string | undefined
    if (planType === 'flame' || planType === 'superflame') {
      try {
        // Check if VoiceRSS is configured
        if (!voiceRSSTTSService.isAvailable()) {
          console.warn('⚠️ VoiceRSS API key is not configured. Voice generation will be skipped. Email will be sent without audio.')
          console.warn('💡 To enable voice: Set VOICE_RSS_API_KEY in your .env.local file')
        } else {
          // Generate audio URL using VoiceRSS API
          audioUrl = await voiceRSSTTSService.generateSpeechUrlAsync(answerTextInternalEn)
          console.log('✅ Voice generated for Flame plan using VoiceRSS:', audioUrl)
        }
      } catch (error) {
        console.error('❌ Error generating voice for Flame plan:', error)
        console.warn('⚠️ Continuing without voice - email will be sent without audio')
        // Continue without voice - email will be sent without audio
        audioUrl = undefined
      }
    }

    // Schedule email delivery
    const deliveryDelay = getDeliveryDelay(planType)
    try {
      await scheduleEmailDelivery(userEmail, {
        userName,
        userEmail,
        question: question.text_original,
        answer: (planType === 'flame' || planType === 'superflame') ? '' : answerTextTranslated, // No full answer for Flame/SuperFlame plans
        planType,
        audioUrl,
        questionId: question.id,
        answerId: answer.id,
      }, deliveryDelay)
      console.log(`✅ Email scheduled for delivery in ${deliveryDelay} hours (${Math.round(deliveryDelay * 60)} minutes)`)

      // For all plans, rely on cron job to send at scheduled time
      // Gmail provider ab bhi delays respect karega
      const isTestMode = process.env.EMAIL_TEST_MODE === 'true'

      if (isTestMode) {
        console.log(`🧪 Test mode: Email will be sent immediately for ${planType} plan`)
      } else {
        const delayMinutes = Math.round(deliveryDelay * 60)
        console.log(`⏰ Email will be sent via cron job in ${delayMinutes} minutes for ${planType} plan`)
        console.log(`💡 Make sure /api/email/cron is called every minute (configured in vercel.json)`)
      }
    } catch (error) {
      console.error('Error scheduling email delivery:', error)
      // Don't fail the request if email scheduling fails
    }

    // Get updated quota status
    const quotaStatus = await quotaService.getQuotaStatus(user.id, planType)

    return createSuccessResponse({
      answer: {
        id: answer.id,
        text: answer.text,
        question_id: answer.question_id,
        created_at: answer.created_at,
        llm_model_used: answer.llm_model_used,
      },
      quota: {
        remaining: quotaStatus.remaining,
        used: quotaStatus.used,
        max: quotaStatus.max,
      },
      emailScheduled: true,
      deliveryTime: deliveryDelay === 5 / 60
        ? 'within 5 minutes'
        : deliveryDelay === 1
          ? 'within 1 hour'
          : deliveryDelay === 24
            ? 'after 24 hours'
            : `in ${Math.round(deliveryDelay * 60)} minutes`,
    })
  } catch (error) {
    console.error('Error in POST /api/questions/answer:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
