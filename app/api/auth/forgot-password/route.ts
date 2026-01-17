import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return createErrorResponse('Email is required', 400)
    }

    const supabase = await createClient()

    // Send password reset email via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
      // Don't reveal if email exists or not (security best practice)
      // Always return success message
      return createSuccessResponse({
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    return createSuccessResponse({
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
