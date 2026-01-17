import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'

/**
 * POST /api/anythingllm/sync-context
 * DEPRECATED: This endpoint is disabled. User context is now injected directly into LLM prompts.
 * Keeping for backward compatibility but returns success without doing anything.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Direct data injection flow - no need for document embedding
    // User data is fetched directly from DB on each query
    return NextResponse.json({
      success: true,
      message: 'Sync-context is deprecated. User data is now injected directly into LLM prompts on each query.',
      deprecated: true,
    })
  } catch (error) {
    console.error('Error in sync-context (deprecated):', error)
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
