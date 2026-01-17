/**
 * Vision API Service
 * Analyzes palm images using Google Cloud Vision API
 */

import { ImageAnnotatorClient } from '@google-cloud/vision'
import type { PalmImage } from './user-context'

/**
 * Initialize Google Cloud Vision client
 * Supports service account JSON via:
 * 1. GOOGLE_APPLICATION_CREDENTIALS environment variable (path to JSON file)
 * 2. GOOGLE_SERVICE_ACCOUNT_JSON environment variable (JSON string)
 */
function getVisionClient(): ImageAnnotatorClient | null {
  try {
    // Option 1: Service account JSON file path
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return new ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      })
    }

    // Option 2: Service account JSON as string
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
      return new ImageAnnotatorClient({
        credentials,
      })
    }

    // Option 3: Try default credentials (if running on GCP or with gcloud auth)
    try {
      return new ImageAnnotatorClient()
    } catch {
      return null
    }
  } catch (error) {
    console.error('Error initializing Google Cloud Vision client:', error)
    return null
  }
}

/**
 * Format vision API results into palmistry-friendly description
 */
function formatVisionResults(
  labels: any[],
  objects: any[],
  imageProperties: any,
  palmType: string
): string {
  const parts: string[] = []

  parts.push(`Palm Image Analysis (${palmType.replace('_', ' ')}):`)
  parts.push('')

  // Labels (what the API detected)
  if (labels && labels.length > 0) {
    parts.push('Detected Features:')
    const relevantLabels = labels
      .filter((label) => {
        const desc = label.description?.toLowerCase() || ''
        return (
          desc.includes('hand') ||
          desc.includes('palm') ||
          desc.includes('finger') ||
          desc.includes('line') ||
          desc.includes('skin') ||
          desc.includes('texture') ||
          desc.includes('pattern')
        )
      })
      .slice(0, 10) // Top 10 relevant labels

    if (relevantLabels.length > 0) {
      relevantLabels.forEach((label, index) => {
        const confidence = Math.round((label.score || 0) * 100)
        parts.push(`  ${index + 1}. ${label.description} (${confidence}% confidence)`)
      })
    } else {
      // If no specific palm-related labels, include top general labels
      labels.slice(0, 5).forEach((label, index) => {
        const confidence = Math.round((label.score || 0) * 100)
        parts.push(`  ${index + 1}. ${label.description} (${confidence}% confidence)`)
      })
    }
    parts.push('')
  }

  // Object localization (where objects are in the image)
  if (objects && objects.length > 0) {
    parts.push('Detected Objects and Locations:')
    objects.slice(0, 5).forEach((obj, index) => {
      const confidence = Math.round((obj.score || 0) * 100)
      const name = obj.name || 'Unknown object'
      parts.push(`  ${index + 1}. ${name} (${confidence}% confidence)`)
      if (obj.boundingPoly?.normalizedVertices) {
        const vertices = obj.boundingPoly.normalizedVertices
        parts.push(`     Location: ${vertices.length} vertices detected`)
      }
    })
    parts.push('')
  }

  // Image properties (colors, dominant colors, etc.)
  if (imageProperties?.dominantColors?.colors) {
    parts.push('Image Characteristics:')
    const colors = imageProperties.dominantColors.colors.slice(0, 5)
    colors.forEach((color: any, index: number) => {
      const rgb = color.color || {}
      const score = Math.round((color.score || 0) * 100)
      parts.push(
        `  Color ${index + 1}: RGB(${rgb.red || 0}, ${rgb.green || 0}, ${rgb.blue || 0}) - ${score}% prominence`
      )
    })
    parts.push('')
  }

  // Palmistry-specific interpretation
  parts.push('Palmistry Insights:')
  parts.push(
    'Based on the detected features, this palm image shows characteristics that can be analyzed for palmistry purposes. The detected lines, patterns, and hand features provide valuable information for astrological and palmistry guidance.'
  )

  return parts.join('\n')
}

/**
 * Analyze a single palm image using Google Cloud Vision API
 */
export async function analyzePalmImage(
  imageUrl: string,
  palmType: string
): Promise<string> {
  const client = getVisionClient()

  if (!client) {
    console.warn(
      'Google Cloud Vision API not configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON environment variable.'
    )
    return `Palm image analysis unavailable. Image type: ${palmType}. Please configure Google Cloud Vision API credentials.`
  }

  try {
    // Download image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBytes = Buffer.from(imageBuffer)

    // Perform all three types of analysis in parallel
    const [labelResult, objectResult, propertiesResult] = await Promise.all([
      client.labelDetection({ image: { content: imageBytes } }),
      client.objectLocalization({ image: { content: imageBytes } }),
      client.imageProperties({ image: { content: imageBytes } }),
    ])

    // Extract results
    const labels = labelResult[0].labelAnnotations || []
    const objects = objectResult[0].localizedObjectAnnotations || []
    const imageProperties = propertiesResult[0].imagePropertiesAnnotation

    // Format results into palmistry-friendly description
    const description = formatVisionResults(labels, objects, imageProperties, palmType)

    return description
  } catch (error) {
    console.error(`Error analyzing palm image (${palmType}):`, error)
    // Return fallback description instead of throwing
    return `Palm image analysis for ${palmType} encountered an issue. Image is available but detailed analysis is pending. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Analyze all palm images in parallel
 * Returns a Map with palmType as key and description as value
 */
export async function analyzeAllPalmImages(
  images: PalmImage[]
): Promise<Map<string, string>> {
  if (images.length === 0) {
    return new Map()
  }

  // Filter images that have signed URLs
  const imagesWithUrls = images.filter((img) => img.signedUrl)

  if (imagesWithUrls.length === 0) {
    console.warn('No palm images with signed URLs available for analysis')
    return new Map()
  }

  // Analyze all images in parallel
  const analysisPromises = imagesWithUrls.map(async (image) => {
    try {
      const description = await analyzePalmImage(image.signedUrl!, image.palmType)
      return { palmType: image.palmType, description }
    } catch (error) {
      // Don't log as error - analyzePalmImage already handles errors gracefully
      console.warn(
        `Vision analysis skipped for ${image.palmType}:`,
        error instanceof Error ? error.message : 'Unknown error'
      )
      return {
        palmType: image.palmType,
        description: `Palm image (${image.palmType}) has been uploaded and is available. Detailed analysis will be available once vision API is configured.`,
      }
    }
  })

  const results = await Promise.all(analysisPromises)

  // Convert to Map
  const descriptionsMap = new Map<string, string>()
  results.forEach((result) => {
    descriptionsMap.set(result.palmType, result.description)
  })

  return descriptionsMap
}

/**
 * Check if vision API is available
 */
export function isVisionAPIAvailable(): boolean {
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  )
}
