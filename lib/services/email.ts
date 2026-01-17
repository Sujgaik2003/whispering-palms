/**
 * Email Service
 * Handles professional email formatting and delivery for question answers
 */

import { createClient } from '@/lib/supabase/server'

export type PlanType = 'basic' | 'spark' | 'flame' | 'superflame'

interface EmailData {
  userName?: string
  userEmail: string
  question: string
  answer: string
  planType: PlanType
  audioUrl?: string // For Flame plan
  questionId: string
  answerId: string
}

/**
 * Generate professional email HTML for answer delivery
 */
export function generateAnswerEmail(data: EmailData): string {
  const { userName, userEmail, question, answer, planType, audioUrl } = data
  const greeting = userName ? `Dear ${userName},` : 'Dear Valued Client,'
  
  // Company logo - MUST be set in .env.local file (COMPANY_LOGO_URL)
  // Do NOT use public folder, only use environment variable
  const logoUrl = process.env.COMPANY_LOGO_URL
  const hasLogo = !!logoUrl && logoUrl.trim() !== '' && 
                  !logoUrl.includes('your-domain.com') && 
                  !logoUrl.includes('placeholder') &&
                  !logoUrl.includes('example.com')
  
  if (planType === 'flame' || planType === 'superflame') {
    // Flame plan: Voice narration, no full written answer
    const fullAudioUrl = audioUrl 
      ? (audioUrl.startsWith('http') ? audioUrl : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${audioUrl}`)
      : ''
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Personal Reading</title>
  <style>
    /* Email-safe styles with pulse animation */
    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.7;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    .avatar-container {
      position: relative;
      display: inline-block;
      cursor: pointer;
      transition: transform 0.3s ease;
    }
    .avatar-container:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #f5f5f0; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${hasLogo ? `
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 2px solid #d4af37;">
              <img src="${logoUrl}" alt="Whispering Palms" style="max-width: 200px; height: auto;" />
            </td>
          </tr>
          ` : `
          <!-- Header without Logo -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 2px solid #d4af37;">
              <h1 style="margin: 0; color: #333333; font-size: 28px; font-family: 'Georgia', serif;">Whispering Palms</h1>
            </td>
          </tr>
          `}
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; color: #333333; font-size: 16px;">${greeting}</p>
            </td>
          </tr>
          
          <!-- Question Section -->
          <tr>
            <td style="padding: 20px 40px; background-color: #fafafa; border-left: 4px solid #d4af37;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Question</p>
              <p style="margin: 0; color: #333333; font-size: 16px; font-style: italic;">"${question}"</p>
            </td>
          </tr>
          
          <!-- Voice Reading Section -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; text-align: center; font-family: 'Georgia', serif;">Your Personal Reading</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 15px; text-align: center; line-height: 1.6;">
                Your personalized reading has been carefully prepared based on your birth details and palm analysis.
              </p>
              ${audioUrl ? `
              <!-- Astrologer Avatar (Clickable to play audio) -->
              <div style="text-align: center; margin: 0 0 25px;">
                ${(() => {
                  const avatarUrl = process.env.ASTROLOGER_AVATAR_URL
                  const hasAvatar = !!avatarUrl && avatarUrl.trim() !== '' && 
                                  !avatarUrl.includes('your-domain.com') && 
                                  !avatarUrl.includes('placeholder') &&
                                  !avatarUrl.includes('example.com')
                  
                  if (hasAvatar) {
                    return `
                    <a href="${fullAudioUrl}" style="display: inline-block; text-decoration: none; cursor: pointer;">
                      <img src="${avatarUrl}" alt="Our Astrologer" style="width: 120px; height: 120px; border-radius: 50%; border: 3px solid #d4af37; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3); transition: transform 0.3s ease;" />
                    </a>
                    <p style="margin: 10px 0 0; color: #666666; font-size: 12px; font-style: italic;">Click the avatar to listen</p>
                    `
                  }
                  return ''
                })()}
              </div>
              
              <!-- Audio Player Card -->
              <div style="text-align: center; margin: 0 auto; padding: 25px 30px; background: linear-gradient(135deg, #fff9e6 0%, #fff5d6 100%); border-radius: 12px; border: 2px solid #d4af37; max-width: 500px;">
                <p style="margin: 0 0 20px; color: #333333; font-size: 16px; font-weight: 500;">Listen to your reading</p>
                
                <!-- Audio Player -->
                <div style="margin-top: 20px;">
                  <audio controls style="width: 100%; margin: 0 auto; display: block; border-radius: 10px; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <source src="${fullAudioUrl}" type="audio/mpeg">
                    <source src="${fullAudioUrl}" type="audio/wav">
                    Your browser does not support the audio element.
                  </audio>
                </div>
                
                <!-- Download Link -->
                <p style="margin: 15px 0 0; color: #666666; font-size: 12px;">
                  <a href="${fullAudioUrl}" download style="color: #d4af37; text-decoration: none; font-weight: 500; border-bottom: 1px solid #d4af37;">Download audio file</a>
                </p>
              </div>
              ` : `
              <div style="text-align: center; padding: 40px; background-color: #fff9e6; border-radius: 12px; border: 2px solid #d4af37;">
                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">Your voice reading is being prepared and will be available shortly. You will receive a notification once it's ready.</p>
              </div>
              `}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="margin: 0 0 10px; color: #333333; font-size: 16px; font-weight: bold;">Whispering Palms</p>
              <p style="margin: 0; color: #666666; font-size: 13px;">May the stars guide your path</p>
              <p style="margin: 20px 0 0; color: #999999; font-size: 12px;">
                This is a personalized reading based on your birth details and palm analysis.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
  } else {
    // Basic and Spark plans: Written text answer
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Answer</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #f5f5f0; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${hasLogo ? `
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 2px solid #d4af37;">
              <img src="${logoUrl}" alt="Whispering Palms" style="max-width: 200px; height: auto;" />
            </td>
          </tr>
          ` : `
          <!-- Header without Logo -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 2px solid #d4af37;">
              <h1 style="margin: 0; color: #333333; font-size: 28px; font-family: 'Georgia', serif;">Whispering Palms</h1>
            </td>
          </tr>
          `}
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; color: #333333; font-size: 16px;">${greeting}</p>
            </td>
          </tr>
          
          <!-- Question Section -->
          <tr>
            <td style="padding: 20px 40px; background-color: #fafafa; border-left: 4px solid #d4af37;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Question</p>
              <p style="margin: 0; color: #333333; font-size: 16px; font-style: italic;">"${question}"</p>
            </td>
          </tr>
          
          <!-- Answer Section -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 15px; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Answer</p>
              <div style="color: #333333; font-size: 16px; line-height: 1.8; font-family: 'Georgia', serif;">
                ${answer.split('\n').filter(para => para.trim()).map(para => `<p style="margin: 0 0 15px; text-align: justify;">${para.trim()}</p>`).join('')}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="margin: 0 0 10px; color: #333333; font-size: 16px; font-weight: bold;">Whispering Palms</p>
              <p style="margin: 0; color: #666666; font-size: 13px;">May the stars guide your path</p>
              <p style="margin: 20px 0 0; color: #999999; font-size: 12px;">
                This is a personalized reading based on your birth details and palm analysis.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
  }
}

/**
 * Schedule email delivery based on plan type
 * For PoC, we store email metadata in answers table and process via API endpoint
 */
export async function scheduleEmailDelivery(
  userEmail: string,
  emailData: EmailData,
  delayHours: number
): Promise<void> {
  const supabase = await createClient()
  
  // Calculate delivery time (delayHours can be fractional for minutes)
  const now = new Date()
  // Convert hours to milliseconds with precise calculation
  // For 5 minutes: 5/60 = 0.083333 hours = 300000 ms
  const delayMs = Math.round(delayHours * 60 * 60 * 1000) // Round to avoid floating point issues
  const deliveryTime = new Date(now.getTime() + delayMs)
  
  // Log for debugging
  const delayMinutes = Math.round(delayMs / (60 * 1000))
  const delaySeconds = Math.round(delayMs / 1000)
  console.log(`📅 Scheduling email for ${emailData.planType} plan:`)
  console.log(`   Current time: ${now.toISOString()}`)
  console.log(`   Delivery time: ${deliveryTime.toISOString()}`)
  console.log(`   Delay: ${delayHours} hours = ${delayMinutes} minutes = ${delaySeconds} seconds`)
  console.log(`   Delay in ms: ${delayMs}`)
  
  // Store email metadata in answers table
  // In production, use a proper job queue (BullMQ, etc.)
  // For PoC, we'll update the answer record with email metadata
  await supabase
    .from('answers')
    .update({
      email_metadata: {
        user_email: userEmail,
        plan_type: emailData.planType,
        delivery_time: deliveryTime.toISOString(),
        audio_url: emailData.audioUrl,
        status: 'pending',
      },
    })
    .eq('id', emailData.answerId)
}

/**
 * Get delivery delay in hours based on plan type
 * TEST MODE: If EMAIL_TEST_MODE=true, Basic and Flame plans send immediately (0 hours)
 * GMAIL SMTP: Always sends immediately (0 hours) - testing/PoC only
 * This allows quick testing of email templates without waiting for delays
 * 
 * To disable test mode: Remove EMAIL_TEST_MODE from .env.local or set it to false
 */
export function getDeliveryDelay(planType: PlanType): number {
  // Check for test mode override (only if explicitly set to true)
  const isTestMode = process.env.EMAIL_TEST_MODE === 'true'
  
  if (isTestMode) {
    // Test mode: All plans send immediately
    console.log(`🧪 Test mode enabled: Emails will send immediately`)
    return 0
  }
  
  // Production mode: Normal delays (applies to ALL providers including Gmail)
  // Gmail provider ab bhi delays respect karega
  switch (planType) {
    case 'basic':
      return 24 // 24 hours for Basic plan
    case 'spark':
      return 1 // 1 hour for Spark plan
    case 'flame':
    case 'superflame':
      return 5 / 60 // 5 minutes for Flame and SuperFlame plans (5/60 = 0.083 hours)
    default:
      return 24
  }
}
