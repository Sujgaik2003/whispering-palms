/**
 * GET /api/email/cron
 * Cron job endpoint to check and send pending emails
 * Should be called every minute by an external cron service (e.g., Vercel Cron, GitHub Actions, etc.)
 * 
 * For local development, you can call this manually or set up a simple cron job
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'
import { sendEmail, getEmailProvider } from '@/lib/services/email-sender'
import { generateAnswerEmail } from '@/lib/services/email'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const now = new Date()

    // Get all pending emails that are due for delivery
    const { data: answers, error: fetchError } = await supabase
      .from('answers')
      .select(`
        id,
        text,
        text_internal_en,
        email_metadata,
        user_id,
        question_id,
        questions!inner (
          id,
          text_original,
          user_id
        )
      `)
      .not('email_metadata', 'is', null)

    if (fetchError) {
      console.error('Error fetching pending emails:', fetchError)
      return createErrorResponse('Failed to fetch pending emails', 500)
    }

    if (!answers || answers.length === 0) {
      console.log('📭 No pending emails found')
      return createSuccessResponse({
        sent: 0,
        message: 'No pending emails',
      })
    }

    console.log(`📬 Found ${answers.length} pending email(s) to check`)

    let sentCount = 0
    const errors: string[] = []

    for (const answer of answers) {
      const emailMetadata = answer.email_metadata as any
      if (!emailMetadata || emailMetadata.status !== 'pending') continue

      // Check if email is due for delivery
      const deliveryTime = new Date(emailMetadata.delivery_time)
      const isTestMode = process.env.EMAIL_TEST_MODE === 'true'
      const emailProvider = getEmailProvider()
      const planType = emailMetadata.plan_type || 'basic'

      // Calculate time until delivery
      const timeUntilDelivery = deliveryTime.getTime() - now.getTime()
      const minutesUntilDelivery = Math.round(timeUntilDelivery / (1000 * 60))
      const secondsUntilDelivery = Math.round(timeUntilDelivery / 1000)

      // Debug logging
      console.log(`\n🔍 [CRON] Checking email for ${planType} plan (answer ${answer.id}):`)
      console.log(`   Scheduled delivery time: ${deliveryTime.toISOString()}`)
      console.log(`   Current time:           ${now.toISOString()}`)
      console.log(`   Time difference:        ${minutesUntilDelivery} minutes (${secondsUntilDelivery} seconds)`)
      console.log(`   Test mode:              ${isTestMode}`)
      console.log(`   Email provider:         ${emailProvider}`)
      console.log(`   Is due?                 ${now >= deliveryTime ? 'YES ✅' : 'NO ⏳'}`)

      // Check if email should be sent now
      // IMPORTANT: Only send if delivery time has passed (unless test mode)
      // Gmail provider ab bhi delays respect karega
      const shouldSend =
        isTestMode || // Test mode sends immediately
        now >= deliveryTime // Production: send ONLY if delivery time has passed

      if (!shouldSend) {
        // Log when email will be sent
        if (minutesUntilDelivery > 0) {
          console.log(`⏳ [SKIP] Email for ${planType} plan will be sent in ${minutesUntilDelivery} minutes (${secondsUntilDelivery} seconds)`)
        } else if (secondsUntilDelivery > 0) {
          console.log(`⏳ [SKIP] Email for ${planType} plan will be sent in ${secondsUntilDelivery} seconds`)
        } else {
          console.log(`✅ [READY] Email for ${planType} plan is due now`)
        }
        continue // Skip emails that aren't due yet
      }

      // Log why email is being sent
      let sendReason = ''
      if (isTestMode) {
        sendReason = 'Test mode (immediate)'
      } else {
        sendReason = 'Delivery time reached'
      }

      console.log(`📧 [SEND] Sending email for ${planType} plan (answer ${answer.id})`)
      console.log(`   Reason: ${sendReason}`)
      console.log(`   Scheduled for: ${deliveryTime.toISOString()}`)
      console.log(`   Current time:  ${now.toISOString()}\n`)

      const question = (answer.questions as any)
      const userId = answer.user_id

      if (!question || !userId) {
        errors.push(`Missing data for answer ${answer.id}`)
        continue
      }

      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single()

      if (!userData) {
        errors.push(`User not found for answer ${answer.id}`)
        continue
      }

      try {
        // Generate email HTML
        const emailHtml = generateAnswerEmail({
          userName: userData.name,
          userEmail: userData.email,
          question: question.text_original,
          answer: (emailMetadata.plan_type === 'flame' || emailMetadata.plan_type === 'superflame') ? '' : answer.text,
          planType: emailMetadata.plan_type,
          audioUrl: emailMetadata.audio_url,
          questionId: question.id,
          answerId: answer.id,
        })

        // Send email
        await sendEmail(
          userData.email,
          'Your Personal Reading from Whispering Palms',
          emailHtml
        )

        // Update answer email metadata to sent
        const sentAt = new Date().toISOString()
        await supabase
          .from('answers')
          .update({
            email_metadata: {
              ...emailMetadata,
              status: 'sent',
              sent_at: sentAt,
            },
          })
          .eq('id', answer.id)

        // Update question status to 'sent' and set email_sent_at
        await supabase
          .from('questions')
          .update({
            status: 'sent',
            email_sent_at: sentAt,
          })
          .eq('id', question.id)

        sentCount++
        console.log(`✅ Email sent for answer ${answer.id} (plan: ${emailMetadata.plan_type})`)
      } catch (error) {
        console.error(`Error sending email for answer ${answer.id}:`, error)
        errors.push(`Failed to send email for answer ${answer.id}`)
      }
    }

    return createSuccessResponse({
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Sent ${sentCount} email(s)`,
    })
  } catch (error) {
    console.error('Error in GET /api/email/cron:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
