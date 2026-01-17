import { NextRequest } from 'next/server'
import { verifyToken } from './jwt'
import { AuthenticationError } from '../utils/errors'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
  }
}

export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Also check cookies
  const token = request.cookies.get('auth_token')?.value
  return token || null
}

export function authenticateRequest(request: NextRequest): { userId: string; email: string } {
  const token = getAuthToken(request)
  
  if (!token) {
    throw new AuthenticationError('No authentication token provided')
  }

  try {
    const payload = verifyToken(token)
    return payload
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token')
  }
}
