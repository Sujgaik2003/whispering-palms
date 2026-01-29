/**
 * POST /api/email/send
 * Send pending emails (called by cron job or scheduled task)
 * For PoC, this can be called manually or via a simple scheduler
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'
import { generateAnswerEmail } from '@/lib/services/email'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'

/**
 * Email Provider Type
 * 'resend' - Use Resend API (production-ready)
 * 'zoho' - Use Zoho Mail SMTP (production-ready, professional email)
 * 'gmail' - Use Gmail SMTP (testing/PoC only)
 */
type EmailProvider = 'resend' | 'zoho' | 'gmail'

/**
 * Get email provider from environment variable
 * Defaults to 'zoho' if not specified (production-ready)
 */
function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase()
  if (provider === 'gmail' || provider === 'smtp') {
    return 'gmail'
  }
  if (provider === 'zoho' || provider === 'zohomail') {
    return 'zoho'
  }
  return 'zoho' // Default to Zoho for professional emails
}

/**
 * Get or create Resend client (lazy initialization)
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured. Please add it to .env.local and restart the server.')
  }

  return new Resend(apiKey)
}

/**
 * Get or create Zoho Mail SMTP transporter (lazy initialization)
 * PRODUCTION-READY - Professional email delivery
 */
function getZohoTransporter() {
  const zohoUser = process.env.ZOHO_MAIL_USER
  const zohoPassword = process.env.ZOHO_MAIL_PASSWORD

  if (!zohoUser || !zohoPassword) {
    throw new Error('Zoho Mail SMTP not configured. Please set ZOHO_MAIL_USER and ZOHO_MAIL_PASSWORD in .env.local')
  }

  return nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: zohoUser,
      pass: zohoPassword,
    },
  })
}

/**
 * Get or create Gmail SMTP transporter (lazy initialization)
 * TESTING ONLY - For PoC and low-volume testing
 */
function getGmailTransporter() {
  const gmailUser = process.env.GMAIL_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailAppPassword) {
    throw new Error('Gmail SMTP not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword, // Gmail App Password (not regular password)
    },
  })
}

/**
 * Send email using configured provider (Zoho, Resend, or Gmail SMTP)
 * Zoho Mail is recommended for production - professional and reliable
 */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const provider = getEmailProvider()

  if (provider === 'zoho') {
    // Zoho Mail SMTP (Production-ready)
    console.log('📧 Using Zoho Mail SMTP (Production)')

    if (!process.env.ZOHO_MAIL_USER || !process.env.ZOHO_MAIL_PASSWORD) {
      throw new Error('Zoho Mail SMTP not configured. Please set ZOHO_MAIL_USER and ZOHO_MAIL_PASSWORD in .env.local')
    }

    const transporter = getZohoTransporter()

    try {
      const info = await transporter.sendMail({
        from: `"Whispering Palms" <${process.env.ZOHO_MAIL_USER}>`,
        to,
        subject,
        html,
      })

      console.log('✅ Email sent via Zoho Mail:', info.messageId)
    } catch (error) {
      console.error('Zoho Mail SMTP error:', error)
      throw new Error(`Failed to send email via Zoho Mail: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  } else if (provider === 'gmail') {
    // Gmail SMTP (Testing/PoC only)
    console.log('📧 Using Gmail SMTP (Testing mode)')

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail SMTP not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local')
    }

    const transporter = getGmailTransporter()

    try {
      const info = await transporter.sendMail({
        from: `"Whispering Palms" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      })

      console.log('✅ Email sent via Gmail SMTP:', info.messageId)
    } catch (error) {
      console.error('Gmail SMTP error:', error)
      throw new Error(`Failed to send email via Gmail SMTP: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  } else {
    // Resend API (Production)
    console.log('📧 Using Resend API')

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured. Please add it to .env.local and restart the server.')
    }

    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM is not configured. Please add it to .env.local')
    }

    const resend = getResendClient()

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      })

      if (error) {
        console.error('Resend API error:', error)
        throw new Error(`Failed to send email: ${error.message}`)
      }

      console.log('✅ Email sent via Resend:', data?.id)
    } catch (error) {
      console.error('Error sending email via Resend:', error)
      throw error
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const emailProvider = getEmailProvider()

    // Debug: Check environment variables
    console.log('🔍 Environment check:')
    console.log('  Email Provider:',
      emailProvider === 'zoho' ? 'Zoho Mail (Production)' :
        emailProvider === 'gmail' ? 'Gmail SMTP (Testing)' : 'Resend API'
    )

    if (emailProvider === 'zoho') {
      console.log('  ZOHO_MAIL_USER:', process.env.ZOHO_MAIL_USER ? '✅ Set' : '❌ Missing')
      console.log('  ZOHO_MAIL_PASSWORD:', process.env.ZOHO_MAIL_PASSWORD ? '✅ Set' : '❌ Missing')

      if (!process.env.ZOHO_MAIL_USER || !process.env.ZOHO_MAIL_PASSWORD) {
        return createErrorResponse(
          'Zoho Mail not configured. Please set ZOHO_MAIL_USER and ZOHO_MAIL_PASSWORD in .env.local',
          500
        )
      }
    } else if (emailProvider === 'gmail') {
      console.log('  GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing')
      console.log('  GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing')

      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return createErrorResponse(
          'Gmail SMTP not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local',
          500
        )
      }
    } else {
      console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing')
      console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Missing')

      if (!process.env.RESEND_API_KEY) {
        return createErrorResponse(
          'RESEND_API_KEY is not configured. Please add it to .env.local and restart the server.',
          500
        )
      }

      if (!process.env.EMAIL_FROM) {
        return createErrorResponse(
          'EMAIL_FROM is not configured. Please add it to .env.local',
          500
        )
      }
    }

    console.log('  EMAIL_TEST_MODE:', process.env.EMAIL_TEST_MODE || 'false')

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
      return createSuccessResponse({
        sent: 0,
        message: 'No pending emails',
      })
    }

    let sentCount = 0
    const errors: string[] = []

    for (const answer of answers) {
      const emailMetadata = answer.email_metadata as any
      if (!emailMetadata || emailMetadata.status !== 'pending') continue

      // Check if email is due for delivery
      const deliveryTime = new Date(emailMetadata.delivery_time)
      const isTestMode = process.env.EMAIL_TEST_MODE === 'true'
      const isGmailProvider = emailProvider === 'gmail'

      // Gmail SMTP: Always send immediately (testing mode)
      // Zoho/Resend: Respect delivery time unless test mode is enabled
      if (isGmailProvider) {
        // Gmail SMTP - always send immediately for testing
        console.log(`📧 Gmail SMTP: Sending email immediately (scheduled for ${deliveryTime.toISOString()})`)
      } else if (!isTestMode && now < deliveryTime) {
        // Production mode: respect scheduled delivery time
        continue
      } else if (isTestMode && now < deliveryTime) {
        // Test mode: send immediately
        console.log(`🧪 TEST MODE: Sending email immediately (scheduled for ${deliveryTime.toISOString()})`)
      }

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
    console.error('Error in POST /api/email/send:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
