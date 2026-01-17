import { NextResponse } from 'next/server'
import { AppError } from './errors'

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

export function createSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

export function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
      },
    },
    { status }
  )
}

export function errorResponse(error: unknown, status?: number) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      },
      { status: status || error.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: 'INTERNAL_ERROR',
        },
      },
      { status: status || 500 }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
    },
    { status: status || 500 }
  )
}
