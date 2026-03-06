import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'
import { anythingLLMService } from '@/lib/services/anythingllm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, country } = body

    // Validate input
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    if (password.length < 8) {
      return createErrorResponse('Password must be at least 8 characters', 400)
    }

    const supabase = await createClient()

    let authData, authError;

    // Sign up with Supabase Auth
    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
          country: country || '',
        },
      },
    })

    authData = signUpResult.data;
    authError = signUpResult.error;

    // If signUp doesn't return an error but identities is empty, the user already exists!
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      // Attempt to sign them in with the password they provided instead
      const signInResult = await supabase.auth.signInWithPassword({ email, password });

      if (signInResult.error) {
        return createErrorResponse('An account with this email already exists. The password provided is incorrect. Please log in.', 401);
      }

      authData = signInResult.data as any; // Cast to bypass strict TS error
      authError = null;
    } else if (authError) {
      return createErrorResponse(authError.message, 400)
    }

    if (!authData.user) {
      return createErrorResponse('Failed to create or login user', 500)
    }

    // Create user record in custom users table
    // This allows us to store additional fields not in Supabase Auth
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: authData.user.email!,
      name: name || null,
      country: country || null,
      email_verified: authData.user.email_confirmed_at ? true : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // If database insert fails but user was created in Auth, continue
    // (user can update profile later)
    if (dbError) {
      console.error('Failed to create user record:', dbError)
      // Don't fail the request, user can complete profile later
    }

    // Create AnythingLLM workspace for the user (non-blocking)
    // This happens in the background, so registration doesn't fail if AnythingLLM is down
    try {
      const workspaceId = await anythingLLMService.createWorkspace(
        authData.user.id,
        name || email
      )

      // Store workspace ID in database
      await supabase.from('anythingllm_workspaces').insert({
        user_id: authData.user.id,
        workspace_id: workspaceId,
      })

    } catch (workspaceError) {
      // Workspace creation failed but don't fail registration
      // Workspace can be created later when user accesses Q&A features
      // Only log if it's not an API key issue (to reduce noise)
      if (workspaceError instanceof Error && !workspaceError.message.includes('API key')) {
        console.error('Error creating AnythingLLM workspace:', workspaceError)
      }
    }

    return createSuccessResponse({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        email_verified: !!authData.user.email_confirmed_at,
      },
      message: authData.user.email_confirmed_at
        ? 'Registration successful'
        : 'Registration successful. Please check your email to verify your account.',
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
