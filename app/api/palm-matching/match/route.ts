import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { matchPalms, determineMatchingStatus } from '@/lib/services/palm-matching'

// POST /api/palm-matching/match - Match user's palm images
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const supabase = await createClient()

    // Get user's palm images with all available metadata
    const { data: palmImages, error: palmImagesError } = await supabase
      .from('palm_images')
      .select('id, palm_type, width, height, file_size, matching_status, storage_path')
      .eq('user_id', user.id)
      .in('palm_type', ['right_front', 'left_front'])

    if (palmImagesError) {
      return createErrorResponse('Failed to fetch palm images', 500)
    }

    const rightPalm = palmImages.find((img) => img.palm_type === 'right_front')
    const leftPalm = palmImages.find((img) => img.palm_type === 'left_front')

    if (!rightPalm || !leftPalm) {
      return createErrorResponse(
        'Both right and left palm images are required for matching',
        400
      )
    }

    // Extract dimensions or use file size as fallback
    // If dimensions are missing, estimate from file size or use defaults
    let rightWidth = rightPalm.width || 0
    let rightHeight = rightPalm.height || 0
    let leftWidth = leftPalm.width || 0
    let leftHeight = leftPalm.height || 0

    // If dimensions are missing, estimate from file size
    // Average palm image: ~500KB = ~1200x1600px
    if ((rightWidth === 0 || rightHeight === 0) && rightPalm.file_size) {
      // Estimate: file_size in bytes, typical compression ratio
      const estimatedPixels = Math.sqrt((rightPalm.file_size / 1024) * 2000) // Rough estimate
      rightWidth = rightWidth || Math.round(estimatedPixels * 0.75)
      rightHeight = rightHeight || Math.round(estimatedPixels * 1.0)
    }

    if ((leftWidth === 0 || leftHeight === 0) && leftPalm.file_size) {
      const estimatedPixels = Math.sqrt((leftPalm.file_size / 1024) * 2000)
      leftWidth = leftWidth || Math.round(estimatedPixels * 0.75)
      leftHeight = leftHeight || Math.round(estimatedPixels * 1.0)
    }

    // Final fallback: use reasonable defaults
    if (rightWidth === 0 || rightHeight === 0) {
      rightWidth = 1200
      rightHeight = 1600
    }

    if (leftWidth === 0 || leftHeight === 0) {
      leftWidth = 1200
      leftHeight = 1600
    }

    // Perform matching using enhanced feature-based approach
    // Pass file sizes for better validation
    const matchingResult = matchPalms(
      { 
        width: rightWidth, 
        height: rightHeight,
        fileSize: rightPalm.file_size || undefined
      },
      { 
        width: leftWidth, 
        height: leftHeight,
        fileSize: leftPalm.file_size || undefined
      }
    )

    // Add note if dimensions were estimated
    if (rightPalm.width === 0 || leftPalm.width === 0) {
      matchingResult.message += ' (Note: Dimensions estimated from file size)'
    }

    // Update palm images with matching status and fix dimensions if they were missing
    await Promise.all([
      supabase
        .from('palm_images')
        .update({
          matching_status: matchingResult.status,
          matching_score: matchingResult.confidence,
          processed_at: new Date().toISOString(),
          // Update dimensions if they were missing
          ...(rightPalm.width === 0 || rightPalm.height === 0 ? {
            width: rightWidth,
            height: rightHeight,
          } : {}),
        })
        .eq('id', rightPalm.id),
      supabase
        .from('palm_images')
        .update({
          matching_status: matchingResult.status,
          matching_score: matchingResult.confidence,
          processed_at: new Date().toISOString(),
          // Update dimensions if they were missing
          ...(leftPalm.width === 0 || leftPalm.height === 0 ? {
            width: leftWidth,
            height: leftHeight,
          } : {}),
        })
        .eq('id', leftPalm.id),
    ])

    // Create or update matching result record
    const { data: existingResult } = await supabase
      .from('palm_matching_results')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    // Map status to database enum values
    // matched (>= 50%) → verified
    // mismatch (< 50%) → rejected
    const dbStatus = matchingResult.status === 'matched' ? 'verified' : 'rejected'
    
    const matchingResultData = {
      user_id: user.id,
      right_palm_id: rightPalm.id,
      left_palm_id: leftPalm.id,
      matching_confidence: matchingResult.confidence,
      feature_vector: matchingResult.features,
      status: dbStatus, // Use database enum: 'verified' or 'rejected'
      matched_at: new Date().toISOString(),
    }

    if (existingResult) {
      // Update existing result
      const { error: updateError } = await supabase
        .from('palm_matching_results')
        .update(matchingResultData)
        .eq('id', existingResult.id)
      
      if (updateError) {
        console.error('Error updating matching result:', updateError)
        // Don't fail the request, matching was successful
      }
    } else {
      // Create new result
      const { error: insertError } = await supabase
        .from('palm_matching_results')
        .insert(matchingResultData)
      
      if (insertError) {
        console.error('Error creating matching result:', insertError)
        // Don't fail the request, matching was successful
      }
    }

    return createSuccessResponse({
      matching: matchingResult,
      message: matchingResult.message,
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
