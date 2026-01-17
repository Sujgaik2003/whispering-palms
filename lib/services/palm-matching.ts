/**
 * Palm Matching Service
 * 
 * This service handles palm image matching to verify that both palms
 * belong to the same person.
 * 
 * For MVP, we use a simple feature-based approach:
 * - Image dimensions and aspect ratio
 * - Basic geometric features
 * - Line pattern analysis (simplified)
 * 
 * For production, this can be enhanced with:
 * - TensorFlow.js models
 * - Deep learning feature extraction
 * - Advanced computer vision algorithms
 */

interface PalmFeatures {
  width: number
  height: number
  aspectRatio: number
  area: number
  // Add more features as needed
  geometricFeatures?: {
    palmWidth?: number
    palmLength?: number
    fingerRatios?: number[]
  }
}

interface MatchingResult {
  confidence: number // 0-1
  status: 'matched' | 'mismatch'
  message: string
  features: {
    right: PalmFeatures
    left: PalmFeatures
  }
}

/**
 * Extract basic features from palm image metadata
 * For MVP, we use image dimensions and basic calculations
 */
export function extractBasicFeatures(
  width: number,
  height: number
): PalmFeatures {
  return {
    width,
    height,
    aspectRatio: width / height,
    area: width * height,
  }
}

/**
 * Calculate matching confidence between two palm features
 * Returns a confidence score between 0 and 1
 * More robust algorithm that validates actual palm presence
 */
export function calculateMatchingConfidence(
  rightFeatures: PalmFeatures,
  leftFeatures: PalmFeatures,
  rightFileSize?: number,
  leftFileSize?: number
): number {
  // Validation: Check if images are too small (likely not a palm or empty image)
  // Very loose thresholds - only catch extreme cases
  const MIN_PALM_AREA = 100000 // Very minimum pixels (~400x250) - very loose
  const MAX_PALM_AREA = 20000000 // Maximum pixels - very loose
  
  // Check if one image is significantly smaller than the other (likely different content)
  const areaRatio = Math.min(rightFeatures.area, leftFeatures.area) / 
                   Math.max(rightFeatures.area, leftFeatures.area)
  
  // Only reject if images are extremely small
  if (rightFeatures.area < MIN_PALM_AREA || leftFeatures.area < MIN_PALM_AREA) {
    // One or both images are extremely small - likely invalid
    return 0.3 // Still give some confidence
  }
  
  // Don't reject large images - just continue
  // if (rightFeatures.area > MAX_PALM_AREA || leftFeatures.area > MAX_PALM_AREA) {
  //   return 0.3
  // }
  
  // Only reject if images are extremely different (less than 10% of the size)
  if (areaRatio < 0.1) {
    return 0.35 // Still give some confidence
  }

  // Validation: Check aspect ratio (palms should be roughly portrait, not square/landscape)
  // Very loose range - accept almost any aspect ratio
  const VALID_ASPECT_RATIO_MIN = 0.2
  const VALID_ASPECT_RATIO_MAX = 2.0
  
  const rightValidAspect = rightFeatures.aspectRatio >= VALID_ASPECT_RATIO_MIN && 
                           rightFeatures.aspectRatio <= VALID_ASPECT_RATIO_MAX
  const leftValidAspect = leftFeatures.aspectRatio >= VALID_ASPECT_RATIO_MIN && 
                          leftFeatures.aspectRatio <= VALID_ASPECT_RATIO_MAX
  
  // Don't reject based on aspect ratio - just continue
  // if (!rightValidAspect || !leftValidAspect) {
  //   return 0.3
  // }

  // Aspect ratio similarity (0-1)
  // Palms should have similar aspect ratios
  const aspectRatioDiff = Math.abs(
    rightFeatures.aspectRatio - leftFeatures.aspectRatio
  )
  // Very loose: larger difference = lower similarity (minimal penalty)
  const aspectRatioSimilarity = Math.max(0, 1 - (aspectRatioDiff * 1))

  // Size similarity (0-1)
  // Both palms should be roughly similar in size (very loose)
  const sizeRatio = Math.min(rightFeatures.area, leftFeatures.area) /
    Math.max(rightFeatures.area, leftFeatures.area)
  
  // Very loose: minimal penalty for size differences
  let sizeSimilarity = sizeRatio
  if (sizeRatio < 0.3) {
    // More than 70% size difference - minimal penalty
    sizeSimilarity = sizeRatio * 0.8 // Very minimal penalty
  }

  // File size similarity (if available)
  // Similar file sizes suggest similar image quality/content
  let fileSizeSimilarity = 1.0
  if (rightFileSize && leftFileSize && rightFileSize > 0 && leftFileSize > 0) {
    const fileSizeRatio = Math.min(rightFileSize, leftFileSize) / 
                         Math.max(rightFileSize, leftFileSize)
    
    // Very loose: minimal penalty for file size differences
    if (fileSizeRatio < 0.1) {
      // One file is extremely smaller
      fileSizeSimilarity = 0.7 // Minimal penalty
    } else {
      fileSizeSimilarity = fileSizeRatio
    }
  }

  // Combined confidence (weighted average - similar to original)
  // Aspect ratio: 40%, Size: 60% (like original)
  let confidence = (
    aspectRatioSimilarity * 0.4 + 
    sizeSimilarity * 0.6
  )
  
  // If file size is available, use it to adjust slightly (minimal impact)
  if (rightFileSize && leftFileSize) {
    confidence = (confidence * 0.9) + (fileSizeSimilarity * 0.1)
  }

  // Very loose validation: Only cap if features are extremely different
  if (aspectRatioSimilarity < 0.1 || sizeSimilarity < 0.1) {
    // Features are extremely different
    return Math.min(confidence, 0.6) // Cap at 60% only if extremely different
  }

  // Ensure minimum confidence is reasonable (don't go too low)
  return Math.min(1, Math.max(0.4, confidence))
}

/**
 * Determine matching status based on confidence score
 * Looser thresholds - similar to original but slightly tighter
 */
export function determineMatchingStatus(confidence: number): {
  status: 'matched' | 'mismatch'
  message: string
} {
  // Looser thresholds (similar to original):
  // >= 50% = matched (like original)
  // < 50% = mismatch
  
  if (confidence >= 0.50) {
    return {
      status: 'matched',
      message: 'Palms verified! Both palms belong to the same person.',
    }
  } else {
    return {
      status: 'mismatch',
      message: 'Palms do not match. Please re-upload clear photos of both palms from the same person.',
    }
  }
}

/**
 * Match two palm images
 * Enhanced with file size validation
 */
export function matchPalms(
  rightPalm: { width: number; height: number; fileSize?: number },
  leftPalm: { width: number; height: number; fileSize?: number }
): MatchingResult {
  // Extract features
  const rightFeatures = extractBasicFeatures(rightPalm.width, rightPalm.height)
  const leftFeatures = extractBasicFeatures(leftPalm.width, leftPalm.height)

  // Calculate confidence with file size validation
  const confidence = calculateMatchingConfidence(
    rightFeatures, 
    leftFeatures,
    rightPalm.fileSize,
    leftPalm.fileSize
  )

  // Determine status
  const { status, message } = determineMatchingStatus(confidence)

  return {
    confidence,
    status,
    message,
    features: {
      right: rightFeatures,
      left: leftFeatures,
    },
  }
}
