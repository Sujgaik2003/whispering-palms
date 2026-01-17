import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { anythingLLMService } from '@/lib/services/anythingllm'

/**
 * GET /api/anythingllm/debug
 * Debug endpoint to check AnythingLLM integration status
 */
export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    steps: [],
    errors: [],
    warnings: [],
  }

  try {
    // Step 1: Check authentication
    debugInfo.steps.push({ step: 1, name: 'Authentication Check', status: 'checking' })
    const user = await getAuthenticatedUser()
    if (!user) {
      debugInfo.steps[0].status = 'failed'
      debugInfo.steps[0].error = 'User not authenticated'
      return NextResponse.json(debugInfo, { status: 401 })
    }
    debugInfo.steps[0].status = 'success'
    debugInfo.steps[0].data = { user_id: user.id, email: user.email }

    // Step 2: Check workspace in database
    debugInfo.steps.push({ step: 2, name: 'Workspace Database Check', status: 'checking' })
    const supabase = await createClient()
    const { data: workspace, error: workspaceError } = await supabase
      .from('anythingllm_workspaces')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      debugInfo.steps[1].status = 'failed'
      debugInfo.steps[1].error = workspaceError?.message || 'Workspace not found in database'
      debugInfo.errors.push('Workspace not found in database. Please complete registration.')
    } else {
      debugInfo.steps[1].status = 'success'
      debugInfo.steps[1].data = {
        workspace_id: workspace.workspace_id,
        created_at: workspace.created_at,
      }
    }

    if (!workspace || !workspace.workspace_id) {
      return NextResponse.json(debugInfo)
    }

    // Step 3: Verify workspace exists in AnythingLLM
    debugInfo.steps.push({ step: 3, name: 'AnythingLLM Workspace Verification', status: 'checking' })
    try {
      const anythingLLMWorkspace = await anythingLLMService.getWorkspace(workspace.workspace_id)
      if (!anythingLLMWorkspace) {
        debugInfo.steps[2].status = 'failed'
        debugInfo.steps[2].error = 'Workspace not found in AnythingLLM'
        debugInfo.errors.push('Workspace exists in database but not in AnythingLLM')
      } else {
        debugInfo.steps[2].status = 'success'
        debugInfo.steps[2].data = {
          slug: anythingLLMWorkspace.slug || anythingLLMWorkspace.workspace?.slug,
          name: anythingLLMWorkspace.name || anythingLLMWorkspace.workspace?.name,
          id: anythingLLMWorkspace.id || anythingLLMWorkspace.workspace?.id,
        }
      }
    } catch (error) {
      debugInfo.steps[2].status = 'error'
      debugInfo.steps[2].error = error instanceof Error ? error.message : 'Unknown error'
      debugInfo.errors.push(`Failed to verify workspace: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Step 4: List all documents in workspace
    debugInfo.steps.push({ step: 4, name: 'List Documents in Workspace', status: 'checking' })
    try {
      const documents = await anythingLLMService.listDocuments(workspace.workspace_id)
      debugInfo.steps[3].status = 'success'
      debugInfo.steps[3].data = {
        total_documents: documents.length,
        documents: documents.map((doc: any) => ({
          doc_id: doc.doc_id || doc.id,
          name: doc.name || doc.filename,
          type: doc.metadata?.type || 'unknown',
          size: doc.size || doc.metadata?.size,
          created_at: doc.created_at || doc.metadata?.created_at,
          metadata: doc.metadata,
        })),
      }

      // Check for context documents
      const contextDocs = documents.filter((doc: any) => 
        doc.metadata?.type === 'user_context_profile' || 
        doc.name?.includes('user-context')
      )
      
      if (contextDocs.length === 0) {
        debugInfo.warnings.push('No context documents found in workspace')
      } else {
        debugInfo.steps[3].data.context_documents_count = contextDocs.length
      }
    } catch (error) {
      debugInfo.steps[3].status = 'error'
      debugInfo.steps[3].error = error instanceof Error ? error.message : 'Unknown error'
      debugInfo.errors.push(`Failed to list documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Step 5: Check user profile data
    debugInfo.steps.push({ step: 5, name: 'User Profile Data Check', status: 'checking' })
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      debugInfo.steps[4].status = 'success'
      debugInfo.steps[4].data = {
        has_birth_details: !!(profile.date_of_birth || profile.time_of_birth || profile.place_of_birth),
        has_astropalm_text: !!profile.astropalm_profile_text,
        astropalm_text_length: profile.astropalm_profile_text?.length || 0,
        date_of_birth: profile.date_of_birth,
        place_of_birth: profile.place_of_birth,
        time_of_birth: profile.time_of_birth,
      }

      // Build what the context document would look like
      const contextDoc = anythingLLMService.buildContextDocument({
        birthSummary: profile.astropalm_profile_text || undefined,
        palmSummary: undefined,
        keyInsights: undefined,
        preferredLanguage: user.preferred_language || 'en',
        dateOfBirth: profile.date_of_birth?.toString(),
        placeOfBirth: profile.place_of_birth || undefined,
        timeOfBirth: profile.time_of_birth?.toString(),
      })

      debugInfo.steps[4].data.context_document_preview = {
        length: contextDoc.length,
        preview: contextDoc.substring(0, 500) + (contextDoc.length > 500 ? '...' : ''),
        has_content: contextDoc.length > 100,
      }
    } else {
      debugInfo.steps[4].status = 'warning'
      debugInfo.steps[4].warning = 'No profile found'
      debugInfo.warnings.push('User profile is empty - context document will be minimal')
    }

    // Step 6: Test document upload (dry run - don't actually upload)
    debugInfo.steps.push({ step: 6, name: 'Document Upload Test', status: 'checking' })
    try {
      // Check if API key is configured
      const apiKey = process.env.ANYTHINGLLM_API_KEY
      if (!apiKey) {
        debugInfo.steps[5].status = 'warning'
        debugInfo.steps[5].warning = 'API key not configured'
        debugInfo.warnings.push('ANYTHINGLLM_API_KEY environment variable not set')
      } else {
        debugInfo.steps[5].status = 'success'
        debugInfo.steps[5].data = {
          api_key_configured: true,
          api_key_length: apiKey.length,
        }
      }
    } catch (error) {
      debugInfo.steps[5].status = 'error'
      debugInfo.steps[5].error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Step 7: Check AnythingLLM API connectivity
    debugInfo.steps.push({ step: 7, name: 'AnythingLLM API Connectivity', status: 'checking' })
    try {
      const apiUrl = process.env.ANYTHINGLLM_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/v1/workspaces`, {
        headers: {
          'Authorization': `Bearer ${process.env.ANYTHINGLLM_API_KEY || ''}`,
        },
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          debugInfo.steps[6].status = 'success'
          debugInfo.steps[6].data = {
            api_url: apiUrl,
            reachable: true,
            returns_json: true,
          }
        } else {
          debugInfo.steps[6].status = 'warning'
          debugInfo.steps[6].warning = 'API returns HTML instead of JSON'
          debugInfo.warnings.push('AnythingLLM API is returning HTML - check API URL and authentication')
        }
      } else {
        debugInfo.steps[6].status = 'error'
        debugInfo.steps[6].error = `HTTP ${response.status}: ${response.statusText}`
        debugInfo.errors.push(`AnythingLLM API returned error: ${response.status}`)
      }
    } catch (error) {
      debugInfo.steps[6].status = 'error'
      debugInfo.steps[6].error = error instanceof Error ? error.message : 'Unknown error'
      debugInfo.errors.push(`Cannot connect to AnythingLLM: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Summary
    const successCount = debugInfo.steps.filter((s: any) => s.status === 'success').length
    const errorCount = debugInfo.steps.filter((s: any) => s.status === 'error' || s.status === 'failed').length
    const warningCount = debugInfo.steps.filter((s: any) => s.status === 'warning').length

    debugInfo.summary = {
      total_steps: debugInfo.steps.length,
      successful: successCount,
      errors: errorCount,
      warnings: warningCount,
      overall_status: errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success',
    }

    return NextResponse.json(debugInfo, { status: errorCount > 0 ? 500 : 200 })
  } catch (error) {
    debugInfo.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(debugInfo, { status: 500 })
  }
}
