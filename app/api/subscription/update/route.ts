import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'

/**
 * PUT /api/subscription/update
 * Update user's subscription plan (without payment for now)
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { planType } = await request.json()

    if (!planType || !['basic', 'spark', 'flame', 'superflame'].includes(planType)) {
      return createErrorResponse('Invalid plan type. Must be: basic, spark, flame, or superflame', 400)
    }

    const supabase = await createClient()

    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, subscription_plan')
      .eq('user_id', user.id)
      .single()

    if (!existingProfile) {
      return createErrorResponse('User profile not found. Please complete onboarding first.', 404)
    }

    // Update subscription plan
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_plan: planType,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating subscription plan:', updateError)
      return createErrorResponse('Failed to update subscription plan', 500)
    }

    // Update or recreate daily quota for today with new plan
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    // Get quota config for new plan
    const quotaConfig: Record<string, number> = {
      basic: parseInt(process.env.BASIC_MAX_QUESTIONS || '2', 10),
      spark: parseInt(process.env.SPARK_MAX_QUESTIONS || '5', 10),
      flame: parseInt(process.env.FLAME_MAX_QUESTIONS || '8', 10),
      superflame: -1, // Unlimited
    }
    
    const maxQuestions = quotaConfig[planType] === -1 ? 999999 : quotaConfig[planType]
    
    // Calculate reset time (midnight next day)
    const resetAt = new Date()
    resetAt.setHours(24, 0, 0, 0)
    
    // Check if quota exists for today
    const { data: existingQuota } = await supabase
      .from('daily_quotas')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (existingQuota) {
      // Update existing quota with new plan
      const { error: quotaUpdateError } = await supabase
        .from('daily_quotas')
        .update({
          plan_type: planType,
          max_questions: maxQuestions,
          // Reset remaining questions to max for new plan (or keep current if upgrading)
          remaining_questions: Math.max(existingQuota.remaining_questions || 0, maxQuestions),
          reset_at: resetAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingQuota.id)

      if (quotaUpdateError) {
        console.error('Error updating daily quota:', quotaUpdateError)
        // Don't fail the request, just log the error
      } else {
        console.log(`✅ Daily quota updated for plan change: ${planType}`)
      }
    } else {
      // Create new quota for today with new plan
      const { error: quotaCreateError } = await supabase
        .from('daily_quotas')
        .insert({
          user_id: user.id,
          date: today,
          plan_type: planType,
          max_questions: maxQuestions,
          remaining_questions: maxQuestions,
          reset_at: resetAt.toISOString(),
        })

      if (quotaCreateError) {
        console.error('Error creating daily quota:', quotaCreateError)
        // Don't fail the request, just log the error
      } else {
        console.log(`✅ Daily quota created for plan change: ${planType}`)
      }
    }

    return createSuccessResponse({
      message: `Subscription plan updated to ${planType}`,
      planType,
    })
  } catch (error) {
    console.error('Error in PUT /api/subscription/update:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
