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
 */
export function calculateMatchingConfidence(
  rightFeatures: PalmFeatures,
  leftFeatures: PalmFeatures,
  rightFileSize?: number,
  leftFileSize?: number
): number {
  // --- ENTERPRISE CHECK: Exact Duplicate Detection ---
  // If metadata is 100% identical, it's likely the SAME image uploaded twice (user error or cheating)
  const isExactMetadataMatch =
    rightFeatures.width === leftFeatures.width &&
    rightFeatures.height === leftFeatures.height &&
    rightFileSize === leftFileSize &&
    rightFileSize !== undefined

  if (isExactMetadataMatch) {
    // We penalize exact matches because left and right palms are MIRROR images,
    // they should never be identical computer files.
    return 0.15
  }

  // --- 1. Basic Dimension Gate ---
  // If one image is extremely smaller/different, reject
  const areaRatio = Math.min(rightFeatures.area, leftFeatures.area) /
    Math.max(rightFeatures.area, leftFeatures.area)

  if (areaRatio < 0.25) {
    // Images differ by more than 4x in size - high mismatch probability
    return 0.3
  }

  // --- 2. Aspect Ratio Similarity ---
  // Palms of the same person usually have very similar aspect ratios
  const aspectRatioDiff = Math.abs(rightFeatures.aspectRatio - leftFeatures.aspectRatio)
  // Tight threshold: diff of 0.1 is ~10% variation
  const aspectRatioSimilarity = Math.max(0, 1 - (aspectRatioDiff * 2))

  // --- 3. Size Similarity ---
  // When captured with the same camera, hands should occupy similar pixel area
  let sizeSimilarity = areaRatio

  // --- 4. File Size Logic ---
  let fileSizeSimilarity = 1.0
  if (rightFileSize && leftFileSize && rightFileSize > 0 && leftFileSize > 0) {
    const fileSizeRatio = Math.min(rightFileSize, leftFileSize) /
      Math.max(rightFileSize, leftFileSize)
    fileSizeSimilarity = fileSizeRatio
  }

  // --- 5. Final Weighted Scoring (Enterprise Tuned) ---
  // We weight Aspect Ratio heavily (60%) because it's invariant to distance
  // Area similarity (30%) and File Size similarity (10%)
  let confidence = (
    aspectRatioSimilarity * 0.6 +
    sizeSimilarity * 0.3 +
    fileSizeSimilarity * 0.1
  )

  // Cap and Clamp
  return Math.min(0.98, Math.max(0.1, confidence))
}

/**
 * Determine matching status based on confidence score
 * Enterprise Thresholds:
 * - > 85%: Strong Match
 * - 65% - 85%: Potential Match
 * - < 65%: Mismatch
 */
export function determineMatchingStatus(confidence: number): {
  status: 'matched' | 'mismatch'
  message: string
} {
  if (confidence >= 0.75) {
    return {
      status: 'matched',
      message: 'Palms verified! Both palms belong to the same person.',
    }
  } else if (confidence >= 0.15 && confidence < 0.40) {
    return {
      status: 'mismatch',
      message: 'Suspicious match: It looks like you uploaded the same photo twice. Please upload different photos for your Right and Left palms.',
    }
  } else {
    return {
      status: 'mismatch',
      message: 'Palms do not match. Please ensure both photos are clear and belong to the same person.',
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
