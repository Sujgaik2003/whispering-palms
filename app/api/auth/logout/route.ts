import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut()

    if (error) {
      return createErrorResponse(error.message, 500)
    }

    return createSuccessResponse({
      message: 'Logged out successfully',
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
