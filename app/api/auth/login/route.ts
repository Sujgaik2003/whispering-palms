import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    const supabase = await createClient()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return createErrorResponse('Invalid email or password', 401)
    }

    if (!authData.user) {
      return createErrorResponse('Login failed', 500)
    }

    // Update last login time in users table
    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id)

    // Get user data from custom users table
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, name, country, preferred_language, timezone')
      .eq('id', authData.user.id)
      .single()

    return createSuccessResponse({
      user: userData || {
        id: authData.user.id,
        email: authData.user.email,
      },
      session: authData.session,
      message: 'Login successful',
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
