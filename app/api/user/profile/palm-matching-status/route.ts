import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'
import { getAuthenticatedUser } from '@/lib/auth/get-user'

// GET /api/user/profile/palm-matching-status - Get palm matching status
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const supabase = await createClient()

    // Get all palm images with their matching status
    const { data: palmImages, error: palmImagesError } = await supabase
      .from('palm_images')
      .select('id, palm_type, matching_status, matching_score, uploaded_at')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })

    if (palmImagesError) {
      return createErrorResponse('Failed to fetch palm images', 500)
    }

    // Get latest matching result if exists
    const { data: matchingResult, error: matchingError } = await supabase
      .from('palm_matching_results')
      .select('*')
      .eq('user_id', user.id)
      .order('matched_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Check if user has both palms uploaded
    const rightFront = palmImages.find(img => img.palm_type === 'right_front')
    const leftFront = palmImages.find(img => img.palm_type === 'left_front')
    const rightSide = palmImages.find(img => img.palm_type === 'right_side')
    const leftSide = palmImages.find(img => img.palm_type === 'left_side')

    const hasRequiredPalms = rightFront && leftFront
    const hasAllPalms = rightFront && leftFront && rightSide && leftSide

    // Determine overall status
    let overallStatus = 'incomplete'
    if (!hasRequiredPalms) {
      overallStatus = 'incomplete'
    } else if (matchingResult) {
      overallStatus = matchingResult.status
    } else {
      // Check if any images are pending matching
      const pendingImages = palmImages.filter(img => img.matching_status === 'pending')
      overallStatus = pendingImages.length > 0 ? 'pending' : 'ready'
    }

    return createSuccessResponse({
      overallStatus,
      hasRequiredPalms,
      hasAllPalms,
      palmImages,
      matchingResult: matchingResult || null,
      progress: {
        rightFront: !!rightFront,
        leftFront: !!leftFront,
        rightSide: !!rightSide,
        leftSide: !!leftSide,
      },
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
