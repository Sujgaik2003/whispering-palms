import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { anythingLLMService } from '@/lib/services/anythingllm'

/**
 * POST /api/anythingllm/fix-workspaces
 * Fix invalid workspace IDs for current user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get current workspace
    const { data: workspace } = await supabase
      .from('anythingllm_workspaces')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (!workspace) {
      // No workspace, create new one
      const workspaceId = await anythingLLMService.createWorkspace(
        user.id,
        user.name || user.email
      )

      await supabase.from('anythingllm_workspaces').insert({
        user_id: user.id,
        workspace_id: workspaceId,
      })

      return NextResponse.json({
        success: true,
        workspace_id: workspaceId,
        action: 'created',
      })
    }

    // Validate workspace ID
    const workspaceId = workspace.workspace_id
    if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined' || workspaceId === '3') {
      // Invalid workspace, delete and recreate
      await supabase
        .from('anythingllm_workspaces')
        .delete()
        .eq('user_id', user.id)

      const newWorkspaceId = await anythingLLMService.createWorkspace(
        user.id,
        user.name || user.email
      )

      await supabase.from('anythingllm_workspaces').insert({
        user_id: user.id,
        workspace_id: newWorkspaceId,
      })

      return NextResponse.json({
        success: true,
        workspace_id: newWorkspaceId,
        action: 'recreated',
        old_workspace_id: workspaceId,
      })
    }

    // Verify workspace exists in AnythingLLM
    try {
      const verified = await anythingLLMService.getWorkspace(workspaceId)
      if (!verified) {
        throw new Error('Workspace not found')
      }
    } catch (verifyError) {
      // Workspace doesn't exist, recreate
      await supabase
        .from('anythingllm_workspaces')
        .delete()
        .eq('user_id', user.id)

      const newWorkspaceId = await anythingLLMService.createWorkspace(
        user.id,
        user.name || user.email
      )

      await supabase.from('anythingllm_workspaces').insert({
        user_id: user.id,
        workspace_id: newWorkspaceId,
      })

      return NextResponse.json({
        success: true,
        workspace_id: newWorkspaceId,
        action: 'recreated',
        reason: 'workspace_not_found',
      })
    }

    return NextResponse.json({
      success: true,
      workspace_id: workspaceId,
      action: 'valid',
    })
  } catch (error) {
    console.error('Error fixing workspace:', error)
    return NextResponse.json(
      {
        error: 'Failed to fix workspace',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
