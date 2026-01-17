import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get user data from custom users table
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, country, preferred_language, timezone, email_verified, created_at, last_login_at')
      .eq('id', user.id)
      .single()

    if (dbError && dbError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, user might not be in custom table yet
      return createErrorResponse('Failed to fetch user data', 500)
    }

    return createSuccessResponse({
      user: userData || {
        id: user.id,
        email: user.email,
        email_verified: !!user.email_confirmed_at,
      },
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
