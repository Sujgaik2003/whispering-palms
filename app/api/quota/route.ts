import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'
import { quotaService } from '@/lib/services/quota'

/**
 * GET /api/quota
 * Get current quota status for authenticated user
 */
export async function GET(request: NextRequest) {
  console.log('[API] Quota request received')
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const supabase = await createClient()

    // Get user's subscription plan
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_plan')
      .eq('user_id', user.id)
      .single()

    const planType = (profile?.subscription_plan as 'basic' | 'spark' | 'flame' | 'superflame') || 'basic'

    // Get quota status
    const quotaStatus = await quotaService.getQuotaStatus(user.id, planType)

    return createSuccessResponse({
      quota: quotaStatus,
      plan: planType,
    })
  } catch (error) {
    console.error('Error in GET /api/quota:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
