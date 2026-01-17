import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { anythingLLMService } from '@/lib/services/anythingllm'

/**
 * GET /api/anythingllm/workspace
 * Get or create workspace for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Check if workspace already exists
    const { data: existingWorkspace, error: fetchError } = await supabase
      .from('anythingllm_workspaces')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (existingWorkspace) {
      // Validate workspace ID format
      const workspaceId = existingWorkspace.workspace_id
      if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined' || workspaceId === '3') {
        // Invalid workspace ID, delete and recreate
        await supabase
          .from('anythingllm_workspaces')
          .delete()
          .eq('user_id', user.id)
      } else {
        // Verify workspace still exists in AnythingLLM
        try {
          const workspace = await anythingLLMService.getWorkspace(workspaceId)
          if (workspace) {
            return NextResponse.json({
              workspace_id: workspaceId,
              exists: true,
            })
          }
        } catch (error) {
          // Workspace doesn't exist in AnythingLLM, delete and create new one
          await supabase
            .from('anythingllm_workspaces')
            .delete()
            .eq('user_id', user.id)
        }
      }
    }

    // Create new workspace
    try {
      const workspaceId = await anythingLLMService.createWorkspace(
        user.id,
        user.name || user.email
      )

      if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
        console.error('Invalid workspace ID received:', workspaceId)
        throw new Error(`Workspace ID is invalid: ${workspaceId}`)
      }
      
      console.log('Storing workspace ID:', workspaceId, 'for user:', user.id)

      // Store workspace ID in database
      const { error: insertError } = await supabase
        .from('anythingllm_workspaces')
        .upsert(
          {
            user_id: user.id,
            workspace_id: workspaceId,
          },
          {
            onConflict: 'user_id',
          }
        )

      if (insertError) {
        console.error('Error storing workspace:', insertError)
        // If insert fails, still return workspace_id so it can be used
        // User can retry later to sync to database
        return NextResponse.json({
          workspace_id: workspaceId,
          exists: false,
          created: true,
          warning: 'Workspace created but database sync failed. Will retry on next access.',
        })
      }

      return NextResponse.json({
        workspace_id: workspaceId,
        exists: false,
        created: true,
      })
    } catch (workspaceError) {
      // If API key is missing, provide helpful error message
      if (workspaceError instanceof Error && workspaceError.message.includes('API key')) {
        return NextResponse.json(
          {
            error: 'AnythingLLM API key not configured',
            message: 'Please set ANYTHINGLLM_API_KEY in .env.local or disable API key authentication in AnythingLLM settings.',
            details: workspaceError.message,
          },
          { status: 503 }
        )
      }
      throw workspaceError
    }
  } catch (error) {
    console.error('Error in workspace GET:', error)
    return NextResponse.json(
      {
        error: 'Failed to get or create workspace',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/anythingllm/workspace
 * Delete workspace for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get workspace ID
    const { data: workspace, error: fetchError } = await supabase
      .from('anythingllm_workspaces')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // TODO: Delete workspace from AnythingLLM (if API supports it)
    // For now, just delete from database
    // Note: AnythingLLM workspace deletion might need to be done manually or via admin API

    // Delete from database
    const { error: deleteError } = await supabase
      .from('anythingllm_workspaces')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting workspace from DB:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete workspace' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Workspace deleted' })
  } catch (error) {
    console.error('Error in workspace DELETE:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete workspace',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
