/**
 * Palm Feature Extractor
 * Extracts geometric features from palm images using MediaPipe Hands and OpenCV
 * Returns structured JSON data - NO palmistry interpretation
 */

import sharp from 'sharp'
import type { Point2D } from './palm-geometry'
import {
  distance,
  angleBetweenPoints,
  calculateCurvature,
  aspectRatio,
  polygonArea,
  centroid,
  boundingBox,
  polylineLength,
  averageDistanceToLine,
  orientation,
  normalizePoints,
} from './palm-geometry'

// MediaPipe Hands landmark indices
// Reference: https://google.github.io/mediapipe/solutions/hands.html
const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const

export interface HandLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface ExtractedPalmFeatures {
  // Image metadata
  imageWidth: number
  imageHeight: number
  imageAspectRatio: number

  // Hand detection
  handDetected: boolean
  handConfidence?: number
  handLandmarks?: HandLandmark[]
  handLandmarksNormalized?: HandLandmark[]

  // Overall hand shape
  handBoundingBox?: {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number
    aspectRatio: number
  }

  // Palm region measurements
  palmWidth?: number
  palmHeight?: number
  palmAspectRatio?: number
  palmArea?: number
  palmCenter?: Point2D

  // Finger measurements
  fingers?: {
    thumb?: FingerFeatures
    index?: FingerFeatures
    middle?: FingerFeatures
    ring?: FingerFeatures
    pinky?: FingerFeatures
  }

  // Finger ratios
  fingerLengths?: {
    thumb: number
    index: number
    middle: number
    ring: number
    pinky: number
  }

  fingerLengthRatios?: {
    indexToMiddle: number
    ringToMiddle: number
    pinkyToMiddle: number
    thumbToIndex: number
  }

  // Joint angles
  jointAngles?: {
    thumb?: {
      mcp: number // degrees
      ip: number
    }
    index?: {
      mcp: number
      pip: number
      dip: number
    }
    middle?: {
      mcp: number
      pip: number
      dip: number
    }
    ring?: {
      mcp: number
      pip: number
      dip: number
    }
    pinky?: {
      mcp: number
      pip: number
      dip: number
    }
  }

  // Finger curvatures
  fingerCurvatures?: {
    thumb: number
    index: number
    middle: number
    ring: number
    pinky: number
  }

  // Hand orientation
  handOrientation?: number // degrees from horizontal

  // Palm lines (if detectable via edge detection)
  detectedLines?: Array<{
    start: Point2D
    end: Point2D
    length: number
    angle: number
    curvature: number
  }>

  // Overall hand geometry
  handGeometry?: {
    overallCurvature: number
    symmetryScore: number // 0-1, higher = more symmetric
    compactness: number // area / (perimeter^2)
  }
}

export interface FingerFeatures {
  length: number
  width?: number
  curvature: number
  angles: {
    mcp?: number
    pip?: number
    dip?: number
    ip?: number // For thumb
  }
  tipPosition: Point2D
  basePosition: Point2D
}

/**
 * Extract palm features from an image URL
 * Uses MediaPipe Hands for landmark detection and geometric analysis
 */
export async function extractPalmFeatures(
  imageUrl: string,
  palmType: string
): Promise<ExtractedPalmFeatures> {
  try {
    // Download and process image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const image = sharp(Buffer.from(imageBuffer))

    // Get image metadata
    const metadata = await image.metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    const features: ExtractedPalmFeatures = {
      imageWidth: width,
      imageHeight: height,
      imageAspectRatio: aspectRatio(width, height),
      handDetected: false,
    }

    // Convert to RGB buffer for processing
    const rgbBuffer = await image
      .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true })

    // 🔥 CRITICAL FIX: Pass original image buffer to MediaPipe
    // MediaPipe service expects JPEG/PNG buffer, NOT raw RGB data
    // Use the original imageBuffer from fetch, not rgbBuffer.data
    const originalImageBuffer = Buffer.from(imageBuffer)
    const handLandmarks = await detectHandLandmarks(originalImageBuffer, width, height)

    if (handLandmarks && handLandmarks.length > 0) {
      features.handDetected = true
      features.handLandmarks = handLandmarks
      features.handConfidence = 0.8 // Placeholder - would come from MediaPipe

      // Extract features from landmarks
      const extractedFeatures = extractFeaturesFromLandmarks(
        handLandmarks,
        width,
        height
      )

      Object.assign(features, extractedFeatures)
      return features
    } else {
      // ❌ HARD FAIL: No hand detected
      // DO NOT use fallback fake analysis
      // Throw error to propagate up and show retry message to user
      console.error(`[Palm Extraction] ❌ Hand detection failed for ${palmType}`)
      console.error(`[Palm Extraction] No hand landmarks detected - image quality insufficient`)

      throw new Error('PALM_DETECTION_FAILED: Could not detect clear palm in image. Please upload a clearer photo with fingers spread and palm facing camera.')
    }
  } catch (error) {
    // Re-throw palm detection errors as-is
    if (error instanceof Error && error.message.includes('PALM_DETECTION_FAILED')) {
      throw error
    }

    console.error(`[Palm Extraction] Error:`, error)
    throw new Error(`Failed to process palm image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Detect hand landmarks using TensorFlow.js HandPose or MediaPipe
 * Attempts to detect palm landmarks for palmistry analysis
 * 
 * CRITICAL: Returns null if hand detection fails - this will trigger hard fail
 */
async function detectHandLandmarks(
  imageData: Buffer,
  width: number,
  height: number
): Promise<HandLandmark[] | null> {
  try {
    // Try to use MediaPipe Hands service if available
    // This is imported from mediapipe-service.ts if it exists
    try {
      const mediapipeService = await import('./mediapipe-service')
      if (mediapipeService && mediapipeService.extractLandmarks) {
        console.log('[Palm Detection] Using MediaPipe service...')
        const result = await mediapipeService.extractLandmarks(imageData)

        if (result && result.landmarks && result.landmarks.length > 0) {
          console.log('[Palm Detection] ✓ MediaPipe detected', result.landmarks.length, 'landmarks')
          return result.landmarks.map(lm => ({
            x: lm.x,
            y: lm.y,
            z: lm.z || 0,
            visibility: 1.0
          }))
        }
      }
    } catch (mediapipeError) {
      // MediaPipe service not available, continue to fallback
      console.log('[Palm Detection] MediaPipe service not available:',
        mediapipeError instanceof Error ? mediapipeError.message : 'Unknown error')
    }

    // Fallback: Use TensorFlow.js HandPose model (if available)
    try {
      // Note: This requires @tensorflow-models/hand-pose-detection to be installed
      // For production, install: npm install @tensorflow-models/hand-pose-detection @tensorflow/tfjs-node

      // For now, we'll return null to indicate detection failed
      // This will trigger the hard fail path
      console.log('[Palm Detection] ⚠️ No hand detection library available')
      console.log('[Palm Detection] Install: npm install @tensorflow-models/hand-pose-detection @tensorflow/tfjs-node')
      return null
    } catch (tfError) {
      console.error('[Palm Detection] TensorFlow.js error:', tfError)
      return null
    }
  } catch (error) {
    console.error('[Palm Detection] Fatal error:', error)
    return null
  }
}

/**
 * Extract features from detected hand landmarks
 */
function extractFeaturesFromLandmarks(
  landmarks: HandLandmark[],
  imageWidth: number,
  imageHeight: number
): Partial<ExtractedPalmFeatures> {
  const features: Partial<ExtractedPalmFeatures> = {}

  // Convert landmarks to 2D points (normalized to image coordinates)
  const points2D: Point2D[] = landmarks.map((lm) => ({
    x: lm.x * imageWidth,
    y: lm.y * imageHeight,
  }))

  // Hand bounding box
  const bbox = boundingBox(points2D)
  features.handBoundingBox = {
    ...bbox,
    aspectRatio: aspectRatio(bbox.width, bbox.height),
  }

  // Palm region (approximate as area around wrist and finger bases)
  const palmPoints = [
    points2D[HAND_LANDMARKS.WRIST],
    points2D[HAND_LANDMARKS.INDEX_MCP],
    points2D[HAND_LANDMARKS.MIDDLE_MCP],
    points2D[HAND_LANDMARKS.RING_MCP],
    points2D[HAND_LANDMARKS.PINKY_MCP],
  ]

  const palmBbox = boundingBox(palmPoints)
  features.palmWidth = palmBbox.width
  features.palmHeight = palmBbox.height
  features.palmAspectRatio = aspectRatio(palmBbox.width, palmBbox.height)
  features.palmArea = polygonArea(palmPoints)
  features.palmCenter = centroid(palmPoints)

  // Finger lengths and features
  const fingerLengths: Record<string, number> = {}
  const fingerFeatures: Record<string, FingerFeatures> = {}

  // Thumb
  const thumbLength = distance(
    points2D[HAND_LANDMARKS.THUMB_MCP],
    points2D[HAND_LANDMARKS.THUMB_TIP]
  )
  fingerLengths.thumb = thumbLength
  fingerFeatures.thumb = {
    length: thumbLength,
    curvature: calculateCurvature(
      points2D[HAND_LANDMARKS.THUMB_CMC],
      points2D[HAND_LANDMARKS.THUMB_MCP],
      points2D[HAND_LANDMARKS.THUMB_TIP]
    ),
    angles: {
      mcp: angleBetweenPoints(
        points2D[HAND_LANDMARKS.THUMB_CMC],
        points2D[HAND_LANDMARKS.THUMB_MCP],
        points2D[HAND_LANDMARKS.THUMB_IP]
      ).degrees,
      ip: angleBetweenPoints(
        points2D[HAND_LANDMARKS.THUMB_MCP],
        points2D[HAND_LANDMARKS.THUMB_IP],
        points2D[HAND_LANDMARKS.THUMB_TIP]
      ).degrees,
    },
    tipPosition: points2D[HAND_LANDMARKS.THUMB_TIP],
    basePosition: points2D[HAND_LANDMARKS.THUMB_MCP],
  }

  // Index finger
  const indexLength = distance(
    points2D[HAND_LANDMARKS.INDEX_MCP],
    points2D[HAND_LANDMARKS.INDEX_TIP]
  )
  fingerLengths.index = indexLength
  fingerFeatures.index = {
    length: indexLength,
    curvature: calculateCurvature(
      points2D[HAND_LANDMARKS.INDEX_MCP],
      points2D[HAND_LANDMARKS.INDEX_PIP],
      points2D[HAND_LANDMARKS.INDEX_TIP]
    ),
    angles: {
      mcp: angleBetweenPoints(
        points2D[HAND_LANDMARKS.WRIST],
        points2D[HAND_LANDMARKS.INDEX_MCP],
        points2D[HAND_LANDMARKS.INDEX_PIP]
      ).degrees,
      pip: angleBetweenPoints(
        points2D[HAND_LANDMARKS.INDEX_MCP],
        points2D[HAND_LANDMARKS.INDEX_PIP],
        points2D[HAND_LANDMARKS.INDEX_DIP]
      ).degrees,
      dip: angleBetweenPoints(
        points2D[HAND_LANDMARKS.INDEX_PIP],
        points2D[HAND_LANDMARKS.INDEX_DIP],
        points2D[HAND_LANDMARKS.INDEX_TIP]
      ).degrees,
    },
    tipPosition: points2D[HAND_LANDMARKS.INDEX_TIP],
    basePosition: points2D[HAND_LANDMARKS.INDEX_MCP],
  }

  // Middle finger
  const middleLength = distance(
    points2D[HAND_LANDMARKS.MIDDLE_MCP],
    points2D[HAND_LANDMARKS.MIDDLE_TIP]
  )
  fingerLengths.middle = middleLength
  fingerFeatures.middle = {
    length: middleLength,
    curvature: calculateCurvature(
      points2D[HAND_LANDMARKS.MIDDLE_MCP],
      points2D[HAND_LANDMARKS.MIDDLE_PIP],
      points2D[HAND_LANDMARKS.MIDDLE_TIP]
    ),
    angles: {
      mcp: angleBetweenPoints(
        points2D[HAND_LANDMARKS.WRIST],
        points2D[HAND_LANDMARKS.MIDDLE_MCP],
        points2D[HAND_LANDMARKS.MIDDLE_PIP]
      ).degrees,
      pip: angleBetweenPoints(
        points2D[HAND_LANDMARKS.MIDDLE_MCP],
        points2D[HAND_LANDMARKS.MIDDLE_PIP],
        points2D[HAND_LANDMARKS.MIDDLE_DIP]
      ).degrees,
      dip: angleBetweenPoints(
        points2D[HAND_LANDMARKS.MIDDLE_PIP],
        points2D[HAND_LANDMARKS.MIDDLE_DIP],
        points2D[HAND_LANDMARKS.MIDDLE_TIP]
      ).degrees,
    },
    tipPosition: points2D[HAND_LANDMARKS.MIDDLE_TIP],
    basePosition: points2D[HAND_LANDMARKS.MIDDLE_MCP],
  }

  // Ring finger
  const ringLength = distance(
    points2D[HAND_LANDMARKS.RING_MCP],
    points2D[HAND_LANDMARKS.RING_TIP]
  )
  fingerLengths.ring = ringLength
  fingerFeatures.ring = {
    length: ringLength,
    curvature: calculateCurvature(
      points2D[HAND_LANDMARKS.RING_MCP],
      points2D[HAND_LANDMARKS.RING_PIP],
      points2D[HAND_LANDMARKS.RING_TIP]
    ),
    angles: {
      mcp: angleBetweenPoints(
        points2D[HAND_LANDMARKS.WRIST],
        points2D[HAND_LANDMARKS.RING_MCP],
        points2D[HAND_LANDMARKS.RING_PIP]
      ).degrees,
      pip: angleBetweenPoints(
        points2D[HAND_LANDMARKS.RING_MCP],
        points2D[HAND_LANDMARKS.RING_PIP],
        points2D[HAND_LANDMARKS.RING_DIP]
      ).degrees,
      dip: angleBetweenPoints(
        points2D[HAND_LANDMARKS.RING_PIP],
        points2D[HAND_LANDMARKS.RING_DIP],
        points2D[HAND_LANDMARKS.RING_TIP]
      ).degrees,
    },
    tipPosition: points2D[HAND_LANDMARKS.RING_TIP],
    basePosition: points2D[HAND_LANDMARKS.RING_MCP],
  }

  // Pinky finger
  const pinkyLength = distance(
    points2D[HAND_LANDMARKS.PINKY_MCP],
    points2D[HAND_LANDMARKS.PINKY_TIP]
  )
  fingerLengths.pinky = pinkyLength
  fingerFeatures.pinky = {
    length: pinkyLength,
    curvature: calculateCurvature(
      points2D[HAND_LANDMARKS.PINKY_MCP],
      points2D[HAND_LANDMARKS.PINKY_PIP],
      points2D[HAND_LANDMARKS.PINKY_TIP]
    ),
    angles: {
      mcp: angleBetweenPoints(
        points2D[HAND_LANDMARKS.WRIST],
        points2D[HAND_LANDMARKS.PINKY_MCP],
        points2D[HAND_LANDMARKS.PINKY_PIP]
      ).degrees,
      pip: angleBetweenPoints(
        points2D[HAND_LANDMARKS.PINKY_MCP],
        points2D[HAND_LANDMARKS.PINKY_PIP],
        points2D[HAND_LANDMARKS.PINKY_DIP]
      ).degrees,
      dip: angleBetweenPoints(
        points2D[HAND_LANDMARKS.PINKY_PIP],
        points2D[HAND_LANDMARKS.PINKY_DIP],
        points2D[HAND_LANDMARKS.PINKY_TIP]
      ).degrees,
    },
    tipPosition: points2D[HAND_LANDMARKS.PINKY_TIP],
    basePosition: points2D[HAND_LANDMARKS.PINKY_MCP],
  }

  features.fingers = fingerFeatures
  features.fingerLengths = fingerLengths as any

  // Finger length ratios
  if (middleLength > 0) {
    features.fingerLengthRatios = {
      indexToMiddle: indexLength / middleLength,
      ringToMiddle: ringLength / middleLength,
      pinkyToMiddle: pinkyLength / middleLength,
      thumbToIndex: thumbLength / indexLength,
    }
  }

  // Joint angles summary
  features.jointAngles = {
    thumb: {
      mcp: fingerFeatures.thumb.angles.mcp || 0,
      ip: fingerFeatures.thumb.angles.ip || 0,
    },
    index: {
      mcp: fingerFeatures.index.angles.mcp || 0,
      pip: fingerFeatures.index.angles.pip || 0,
      dip: fingerFeatures.index.angles.dip || 0,
    },
    middle: {
      mcp: fingerFeatures.middle.angles.mcp || 0,
      pip: fingerFeatures.middle.angles.pip || 0,
      dip: fingerFeatures.middle.angles.dip || 0,
    },
    ring: {
      mcp: fingerFeatures.ring.angles.mcp || 0,
      pip: fingerFeatures.ring.angles.pip || 0,
      dip: fingerFeatures.ring.angles.dip || 0,
    },
    pinky: {
      mcp: fingerFeatures.pinky.angles.mcp || 0,
      pip: fingerFeatures.pinky.angles.pip || 0,
      dip: fingerFeatures.pinky.angles.dip || 0,
    },
  }

  // Finger curvatures
  features.fingerCurvatures = {
    thumb: fingerFeatures.thumb.curvature,
    index: fingerFeatures.index.curvature,
    middle: fingerFeatures.middle.curvature,
    ring: fingerFeatures.ring.curvature,
    pinky: fingerFeatures.pinky.curvature,
  }

  // Hand orientation
  features.handOrientation = orientation(points2D)

  // Overall hand geometry
  const handArea = polygonArea(points2D)
  const handPerimeter = polylineLength(points2D)
  features.handGeometry = {
    overallCurvature: features.fingerCurvatures
      ? Object.values(features.fingerCurvatures).reduce((a, b) => a + b, 0) / 5
      : 0,
    symmetryScore: calculateSymmetryScore(points2D),
    compactness:
      handPerimeter > 0 ? handArea / (handPerimeter * handPerimeter) : 0,
  }

  return features
}

/**
 * Calculate symmetry score (0-1) for hand landmarks
 */
function calculateSymmetryScore(points: Point2D[]): number {
  if (points.length < 2) return 0

  // Simple symmetry: compare left and right sides of hand
  // This is a simplified metric - real symmetry analysis would be more complex
  const bbox = boundingBox(points)
  const centerX = (bbox.minX + bbox.maxX) / 2

  const leftPoints = points.filter((p) => p.x < centerX)
  const rightPoints = points.filter((p) => p.x >= centerX)

  if (leftPoints.length === 0 || rightPoints.length === 0) return 0.5

  // Compare average distances from center
  const leftAvgDist =
    leftPoints.reduce((sum, p) => sum + Math.abs(p.x - centerX), 0) /
    leftPoints.length
  const rightAvgDist =
    rightPoints.reduce((sum, p) => sum + Math.abs(p.x - centerX), 0) /
    rightPoints.length

  if (leftAvgDist === 0 && rightAvgDist === 0) return 1

  const diff = Math.abs(leftAvgDist - rightAvgDist)
  const maxDist = Math.max(leftAvgDist, rightAvgDist)
  return 1 - Math.min(1, diff / maxDist)
}

/**
 * Basic feature extraction when hand detection fails
 * Uses simple image analysis
 */
async function extractBasicFeatures(
  imageData: Buffer,
  width: number,
  height: number
): Promise<Partial<ExtractedPalmFeatures>> {
  // Basic image analysis without hand detection
  // This provides minimal features when MediaPipe is not available
  return {
    handDetected: false,
    handBoundingBox: {
      minX: 0,
      minY: 0,
      maxX: width,
      maxY: height,
      width,
      height,
      aspectRatio: aspectRatio(width, height),
    },
  }
}

/**
 * Format extracted features as JSON string for LLM
 */
export function formatFeaturesAsJSON(features: ExtractedPalmFeatures): string {
  return JSON.stringify(features, null, 2)
}
