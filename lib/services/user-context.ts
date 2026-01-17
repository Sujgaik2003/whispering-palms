/**
 * User Context Service
 * Fetches user-specific data from Supabase database and storage for direct LLM injection
 */

import { createClient } from '@/lib/supabase/server'

export interface UserContext {
  // Basic user information
  name: string
  email: string
  country?: string
  preferredLanguage: string
  timezone?: string
  
  // Birth details
  dateOfBirth?: string
  timeOfBirth?: string
  placeOfBirth?: string
  birthTimezone?: string
  astropalmProfileText?: string
  
  // Palm images
  palmImages: PalmImage[]
}

export interface PalmImage {
  id: string
  palmType: string
  storagePath: string
  fileName: string
  fileSize: number
  width: number
  height: number
  matchingStatus: string
  uploadedAt: string
  signedUrl?: string
}

/**
 * Fetch complete user context from database
 */
export async function fetchUserContext(userId: string): Promise<UserContext> {
  const supabase = await createClient()

  // Fetch user basic information and profile in parallel
  const [userResult, profileResult] = await Promise.all([
    supabase
      .from('users')
      .select('name, email, country, preferred_language, timezone')
      .eq('id', userId)
      .single(),
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single(),
  ])

  const user = userResult.data
  const profile = profileResult.data

  // Fetch palm images
  const palmImages = await fetchPalmImages(userId)

  return {
    name: user?.name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    country: user?.country || undefined,
    preferredLanguage: user?.preferred_language || 'en',
    timezone: user?.timezone || undefined,
    dateOfBirth: profile?.date_of_birth?.toString(),
    timeOfBirth: profile?.time_of_birth?.toString(),
    placeOfBirth: profile?.place_of_birth || undefined,
    birthTimezone: profile?.birth_timezone || undefined,
    astropalmProfileText: profile?.astropalm_profile_text || undefined,
    palmImages,
  }
}

/**
 * Fetch palm images metadata for a user
 */
export async function fetchPalmImages(userId: string): Promise<PalmImage[]> {
  const supabase = await createClient()

  const { data: images, error } = await supabase
    .from('palm_images')
    .select('id, palm_type, storage_path, file_name, file_size, width, height, matching_status, uploaded_at')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching palm images:', error)
    return []
  }

  return (images || []).map((img: any) => ({
    id: img.id,
    palmType: img.palm_type,
    storagePath: img.storage_path,
    fileName: img.file_name,
    fileSize: img.file_size,
    width: img.width,
    height: img.height,
    matchingStatus: img.matching_status || 'pending',
    uploadedAt: img.uploaded_at,
  }))
}

/**
 * Generate signed URLs for palm images from Supabase Storage
 */
export async function generateImageSignedUrls(
  images: PalmImage[],
  expiresIn: number = 3600 // 1 hour default
): Promise<PalmImage[]> {
  if (images.length === 0) {
    return images
  }

  const supabase = await createClient()

  // Generate signed URLs in parallel
  const signedUrlPromises = images.map(async (image) => {
    try {
      const { data, error } = await supabase.storage
        .from('palm-images')
        .createSignedUrl(image.storagePath, expiresIn)

      if (error) {
        console.error(`Error generating signed URL for ${image.storagePath}:`, error)
        return { ...image, signedUrl: undefined }
      }

      return { ...image, signedUrl: data.signedUrl }
    } catch (error) {
      console.error(`Error generating signed URL for ${image.storagePath}:`, error)
      return { ...image, signedUrl: undefined }
    }
  })

  return Promise.all(signedUrlPromises)
}

/**
 * Format user context into structured text for LLM prompt
 */
export function formatUserContextForLLM(
  context: UserContext,
  palmDescriptions?: Map<string, string> | string[]
): string {
  const sections: string[] = []

  // Header
  sections.push('USER PROFILE INFORMATION')
  sections.push('This document contains the user\'s personal and astrological information for personalized responses.\n')

  // Basic Information Section
  const basicInfo: string[] = []
  if (context.name) {
    basicInfo.push(`Name: ${context.name}`)
  }
  if (context.email) {
    basicInfo.push(`Email: ${context.email}`)
  }
  if (context.country) {
    basicInfo.push(`Country: ${context.country}`)
  }
  if (context.preferredLanguage) {
    basicInfo.push(`Preferred Language: ${context.preferredLanguage}`)
  }
  if (context.timezone) {
    basicInfo.push(`Timezone: ${context.timezone}`)
  }

  if (basicInfo.length > 0) {
    sections.push('BASIC INFORMATION')
    sections.push(basicInfo.join('\n'))
    sections.push('')
  }

  // Birth Details Section
  if (context.dateOfBirth || context.placeOfBirth || context.timeOfBirth) {
    sections.push('BIRTH DETAILS')
    const birthInfo: string[] = []
    if (context.dateOfBirth) {
      birthInfo.push(`Date of Birth: ${context.dateOfBirth}`)
    }
    if (context.timeOfBirth) {
      birthInfo.push(`Time of Birth: ${context.timeOfBirth}`)
    }
    if (context.placeOfBirth) {
      birthInfo.push(`Place of Birth: ${context.placeOfBirth}`)
    }
    if (context.birthTimezone) {
      birthInfo.push(`Birth Timezone: ${context.birthTimezone}`)
    }
    sections.push(birthInfo.join('\n'))
    sections.push('')
  }

  // Birth Chart Analysis Section
  if (context.astropalmProfileText) {
    sections.push('BIRTH CHART ANALYSIS')
    sections.push(context.astropalmProfileText)
    sections.push('')
  } else if (context.dateOfBirth) {
    sections.push('BIRTH CHART ANALYSIS')
    sections.push(
      `Birth details have been provided (${context.dateOfBirth}${context.timeOfBirth ? ` at ${context.timeOfBirth}` : ''}${context.placeOfBirth ? ` in ${context.placeOfBirth}` : ''}). Birth chart analysis is pending.`
    )
    sections.push('')
  }

  // Palm Reading Information Section
  if (palmDescriptions && (palmDescriptions instanceof Map ? palmDescriptions.size > 0 : palmDescriptions.length > 0)) {
    sections.push('PALM READING INFORMATION')
    
    if (palmDescriptions instanceof Map) {
      // Map format: key = palmType, value = description
      for (const [palmType, description] of palmDescriptions.entries()) {
        sections.push(`\n${palmType.toUpperCase().replace('_', ' ')} PALM:`)
        sections.push(description)
      }
    } else {
      // Array format: just descriptions
      palmDescriptions.forEach((description, index) => {
        sections.push(`\nPALM IMAGE ${index + 1}:`)
        sections.push(description)
      })
    }
    sections.push('')
  } else if (context.palmImages.length > 0) {
    sections.push('PALM READING INFORMATION')
    sections.push(
      `User has uploaded ${context.palmImages.length} palm image(s): ${context.palmImages.map((p) => p.palmType).join(', ')}. Palm images are available for analysis.`
    )
    sections.push('')
  }

  // Footer
  sections.push('---')
  sections.push(
    'Note for AI: Use this information to provide personalized astrological and palm reading insights. When answering questions, reference the user\'s birth details, birth chart summary, and palm reading information when relevant.'
  )

  return sections.join('\n')
}
