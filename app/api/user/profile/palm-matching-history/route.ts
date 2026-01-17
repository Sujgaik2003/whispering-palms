import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'
import { getAuthenticatedUser } from '@/lib/auth/get-user'

// GET /api/user/profile/palm-matching-history - Get palm matching history
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const supabase = await createClient()

    // Get all matching results (simplified - no joins to avoid errors)
    const { data: matchingResults, error: matchingError } = await supabase
      .from('palm_matching_results')
      .select('*')
      .eq('user_id', user.id)
      .order('matched_at', { ascending: false })

    if (matchingError) {
      return createErrorResponse('Failed to fetch matching history', 500)
    }

    return createSuccessResponse({
      history: matchingResults || [],
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
