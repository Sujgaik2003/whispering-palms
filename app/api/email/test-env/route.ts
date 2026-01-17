import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'

/**
 * GET /api/email/test-env
 * Test endpoint to verify environment variables are loaded
 */
export async function GET(request: NextRequest) {
  const envCheck = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing',
    EMAIL_FROM: process.env.EMAIL_FROM || '❌ Missing',
    EMAIL_TEST_MODE: process.env.EMAIL_TEST_MODE || 'false',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '❌ Missing',
  }
  
  // Don't expose the actual API key value
  const apiKeyValue = process.env.RESEND_API_KEY
  const apiKeyPreview = apiKeyValue 
    ? `${apiKeyValue.substring(0, 10)}...${apiKeyValue.substring(apiKeyValue.length - 4)}` 
    : 'Not set'
  
  return createSuccessResponse({
    environment: {
      ...envCheck,
      RESEND_API_KEY_PREVIEW: apiKeyPreview,
    },
    message: 'Environment variables check',
  })
}
