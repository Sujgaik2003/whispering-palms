/**
 * Test script to verify all AnythingLLM API endpoints
 * Tests one by one and reports which ones work
 */

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import FormDataNode from 'form-data'

const API_URL = process.env.ANYTHINGLLM_API_URL || 'http://localhost:3001'
const API_KEY = process.env.ANYTHINGLLM_API_KEY || ''

interface TestResult {
  endpoint: string
  method: string
  status: 'success' | 'error' | 'html'
  statusCode?: number
  message: string
  response?: any
}

export async function GET(request: NextRequest) {
  const results: TestResult[] = []
  
  console.log('🧪 Starting AnythingLLM API endpoint tests...')
  console.log('📡 API URL:', API_URL)
  console.log('🔑 API Key present:', !!API_KEY)
  console.log('🔑 API Key length:', API_KEY.length)
  
  // Test 1: List Workspaces
  console.log('\n📋 Test 1: GET /api/v1/workspaces')
  try {
    const response = await axios.get(`${API_URL}/api/v1/workspaces`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
      validateStatus: () => true,
      responseType: 'text',
    })
    
    const contentType = response.headers['content-type'] || ''
    const isHTML = contentType.includes('text/html') || 
                   (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE'))
    
    if (isHTML) {
      results.push({
        endpoint: 'GET /api/v1/workspaces',
        method: 'GET',
        status: 'html',
        statusCode: response.status,
        message: 'Returned HTML instead of JSON',
        response: response.data.substring(0, 200),
      })
    } else if (response.status === 200) {
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
      results.push({
        endpoint: 'GET /api/v1/workspaces',
        method: 'GET',
        status: 'success',
        statusCode: response.status,
        message: `Success - Found ${data.workspaces?.length || 0} workspaces`,
        response: { count: data.workspaces?.length || 0 },
      })
    } else {
      results.push({
        endpoint: 'GET /api/v1/workspaces',
        method: 'GET',
        status: 'error',
        statusCode: response.status,
        message: `Error: ${response.statusText}`,
        response: response.data,
      })
    }
  } catch (error: any) {
    results.push({
      endpoint: 'GET /api/v1/workspaces',
      method: 'GET',
      status: 'error',
      message: `Exception: ${error.message}`,
    })
  }
  
  // Test 2: Create Workspace (API docs: POST /v1/workspace/new - singular)
  console.log('\n📋 Test 2: POST /api/v1/workspace/new')
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/workspace/new`,
      { name: 'test-workspace-' + Date.now() },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        validateStatus: () => true,
        responseType: 'text',
      }
    )
    
    const contentType = response.headers['content-type'] || ''
    const isHTML = contentType.includes('text/html') || 
                   (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE'))
    
    if (isHTML) {
      results.push({
        endpoint: 'POST /api/v1/workspace/new',
        method: 'POST',
        status: 'html',
        statusCode: response.status,
        message: 'Returned HTML instead of JSON',
        response: response.data.substring(0, 200),
      })
    } else if (response.status === 200 || response.status === 201) {
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
      results.push({
        endpoint: 'POST /api/v1/workspace/new',
        method: 'POST',
        status: 'success',
        statusCode: response.status,
        message: 'Success - Workspace created',
        response: { workspace_id: data.workspace?.id || data.id, slug: data.workspace?.slug },
      })
    } else {
      results.push({
        endpoint: 'POST /api/v1/workspace/new',
        method: 'POST',
        status: 'error',
        statusCode: response.status,
        message: `Error: ${response.statusText}`,
        response: response.data,
      })
    }
  } catch (error: any) {
    results.push({
      endpoint: 'POST /api/v1/workspace/new',
      method: 'POST',
      status: 'error',
      message: `Exception: ${error.message}`,
    })
  }
  
  // Test 3: Document Upload (if we have a workspace)
  // First get a workspace ID and slug
  let testWorkspaceId: string | null = null
  let testWorkspaceSlug: string | null = null
  try {
    const listResponse = await axios.get(`${API_URL}/api/v1/workspaces`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
      validateStatus: () => true,
      responseType: 'text',
    })
    
    if (listResponse.status === 200) {
      const contentType = listResponse.headers['content-type'] || ''
      if (!contentType.includes('text/html')) {
        const data = typeof listResponse.data === 'string' ? JSON.parse(listResponse.data) : listResponse.data
        if (data.workspaces && data.workspaces.length > 0) {
          testWorkspaceId = String(data.workspaces[0].id || data.workspaces[0].workspace_id)
          testWorkspaceSlug = data.workspaces[0].slug || null
        }
      }
    }
  } catch (e) {
    // Ignore
  }
  
  if (testWorkspaceId) {
    console.log('\n📋 Test 3: POST /api/v1/document/upload (API docs: singular "document")')
    try {
      const formData = new FormDataNode()
      formData.append('file', Buffer.from('Test document content', 'utf-8'), {
        filename: 'test-document.txt',
        contentType: 'text/plain',
      })
      formData.append('workspace_id', testWorkspaceId)
      
      const formDataHeaders = formData.getHeaders()
      
      const response = await axios.post(
        `${API_URL}/api/v1/document/upload`,
        formData,
        {
          headers: {
            ...formDataHeaders,
            'Accept': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          validateStatus: () => true,
          responseType: 'text',
        }
      )
      
      const contentType = response.headers['content-type'] || ''
      const isHTML = contentType.includes('text/html') || 
                     (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE'))
      
      if (isHTML) {
        results.push({
          endpoint: 'POST /api/v1/document/upload',
          method: 'POST',
          status: 'html',
          statusCode: response.status,
          message: 'Returned HTML instead of JSON',
          response: response.data.substring(0, 200),
        })
      } else if (response.status === 200 || response.status === 204) {
        let data: any = {}
        if (response.status === 200 && response.data) {
          try {
            data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
          } catch (e) {
            // Ignore parse error
          }
        }
        results.push({
          endpoint: 'POST /api/v1/document/upload',
          method: 'POST',
          status: 'success',
          statusCode: response.status,
          message: 'Success - Document uploaded',
          response: { doc_id: data.doc_id || 'no-id-returned' },
        })
      } else {
        results.push({
          endpoint: 'POST /api/v1/document/upload',
          method: 'POST',
          status: 'error',
          statusCode: response.status,
          message: `Error: ${response.statusText}`,
          response: response.data,
        })
      }
    } catch (error: any) {
      results.push({
        endpoint: 'POST /api/v1/document/upload',
        method: 'POST',
        status: 'error',
        message: `Exception: ${error.message}`,
      })
    }
  } else {
    results.push({
      endpoint: 'POST /api/v1/document/upload',
      method: 'POST',
      status: 'error',
      message: 'Skipped - No workspace available for testing',
    })
  }
  
  // Test 4: List Documents (API docs: GET /v1/documents - global endpoint)
  console.log('\n📋 Test 4: GET /api/v1/documents (global endpoint)')
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/documents`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        validateStatus: () => true,
        responseType: 'text',
      }
    )
    
    const contentType = response.headers['content-type'] || ''
    const isHTML = contentType.includes('text/html') || 
                   (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE'))
    
    if (isHTML) {
      results.push({
        endpoint: 'GET /api/v1/documents',
        method: 'GET',
        status: 'html',
        statusCode: response.status,
        message: 'Returned HTML instead of JSON',
        response: response.data.substring(0, 200),
      })
    } else if (response.status === 200) {
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
      // Handle different response formats
      let allDocs: any[] = []
      if (Array.isArray(data)) {
        allDocs = data
      } else if (data.documents && Array.isArray(data.documents)) {
        allDocs = data.documents
      } else if (data && typeof data === 'object') {
        // Try to find documents array in nested structure
        allDocs = Object.values(data).find((v: any) => Array.isArray(v)) as any[] || []
      }
      
      const workspaceDocs = testWorkspaceId && Array.isArray(allDocs)
        ? allDocs.filter((doc: any) => String(doc.workspace_id) === testWorkspaceId)
        : []
      
      results.push({
        endpoint: 'GET /api/v1/documents',
        method: 'GET',
        status: 'success',
        statusCode: response.status,
        message: `Success - Found ${allDocs.length} total documents${testWorkspaceId ? `, ${workspaceDocs.length} in test workspace` : ''}`,
        response: { total: allDocs.length, workspace: workspaceDocs.length, rawData: typeof data },
      })
    } else {
      results.push({
        endpoint: 'GET /api/v1/documents',
        method: 'GET',
        status: 'error',
        statusCode: response.status,
        message: `Error: ${response.statusText}`,
        response: response.data,
      })
    }
  } catch (error: any) {
    results.push({
      endpoint: 'GET /api/v1/documents',
      method: 'GET',
      status: 'error',
      message: `Exception: ${error.message}`,
    })
  }
  
  // Test 4b: Get Workspace by Slug (API docs: GET /v1/workspace/{slug})
  if (testWorkspaceSlug) {
    console.log('\n📋 Test 4b: GET /api/v1/workspace/{slug}')
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/workspace/${testWorkspaceSlug}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          validateStatus: () => true,
          responseType: 'text',
        }
      )
      
      const contentType = response.headers['content-type'] || ''
      const isHTML = contentType.includes('text/html') || 
                     (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE'))
      
      if (isHTML) {
        results.push({
          endpoint: `GET /api/v1/workspace/${testWorkspaceSlug}`,
          method: 'GET',
          status: 'html',
          statusCode: response.status,
          message: 'Returned HTML instead of JSON',
          response: response.data.substring(0, 200),
        })
      } else if (response.status === 200) {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
        results.push({
          endpoint: `GET /api/v1/workspace/${testWorkspaceSlug}`,
          method: 'GET',
          status: 'success',
          statusCode: response.status,
          message: 'Success - Workspace retrieved',
          response: { slug: data.workspace?.slug || data.slug, name: data.workspace?.name || data.name },
        })
      } else {
        results.push({
          endpoint: `GET /api/v1/workspace/${testWorkspaceSlug}`,
          method: 'GET',
          status: 'error',
          statusCode: response.status,
          message: `Error: ${response.statusText}`,
          response: response.data,
        })
      }
    } catch (error: any) {
      results.push({
        endpoint: `GET /api/v1/workspace/${testWorkspaceSlug}`,
        method: 'GET',
        status: 'error',
        message: `Exception: ${error.message}`,
      })
    }
  }
  
  // Test 5: Chat endpoint (API docs: POST /v1/workspace/{slug}/chat - singular, uses slug)
  if (testWorkspaceSlug) {
    console.log('\n📋 Test 5: POST /api/v1/workspace/{slug}/chat')
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/workspace/${testWorkspaceSlug}/chat`,
        {
          message: 'Hello, this is a test',
          mode: 'query',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          validateStatus: () => true,
          responseType: 'text',
        }
      )
      
      const contentType = response.headers['content-type'] || ''
      const isHTML = contentType.includes('text/html') || 
                     (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE'))
      
      if (isHTML) {
        results.push({
          endpoint: `POST /api/v1/workspace/${testWorkspaceSlug}/chat`,
          method: 'POST',
          status: 'html',
          statusCode: response.status,
          message: 'Returned HTML instead of JSON',
          response: response.data.substring(0, 200),
        })
      } else if (response.status === 200) {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
        results.push({
          endpoint: `POST /api/v1/workspace/${testWorkspaceSlug}/chat`,
          method: 'POST',
          status: 'success',
          statusCode: response.status,
          message: 'Success - Chat response received',
          response: { 
            hasResponse: !!data.textResponse || !!data.response,
            responseLength: (data.textResponse || data.response || '').length,
          },
        })
      } else {
        results.push({
          endpoint: `POST /api/v1/workspace/${testWorkspaceSlug}/chat`,
          method: 'POST',
          status: 'error',
          statusCode: response.status,
          message: `Error: ${response.statusText}`,
          response: response.data,
        })
      }
    } catch (error: any) {
      results.push({
        endpoint: `POST /api/v1/workspace/${testWorkspaceSlug}/chat`,
        method: 'POST',
        status: 'error',
        message: `Exception: ${error.message}`,
      })
    }
  } else {
    results.push({
      endpoint: 'POST /api/v1/workspace/{slug}/chat',
      method: 'POST',
      status: 'error',
      message: 'Skipped - No workspace slug available for testing',
    })
  }
  
  // Summary
  const successCount = results.filter(r => r.status === 'success').length
  const htmlCount = results.filter(r => r.status === 'html').length
  const errorCount = results.filter(r => r.status === 'error').length
  
  console.log('\n📊 Test Summary:')
  console.log('✅ Success:', successCount)
  console.log('❌ HTML responses:', htmlCount)
  console.log('⚠️  Errors:', errorCount)
  
  return NextResponse.json({
    summary: {
      total: results.length,
      success: successCount,
      html: htmlCount,
      errors: errorCount,
    },
    results,
    config: {
      apiUrl: API_URL,
      hasApiKey: !!API_KEY,
      apiKeyLength: API_KEY.length,
    },
  })
}
