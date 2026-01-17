/**
 * Email Scheduler Service
 * Automatically checks and sends pending emails every minute
 * Runs in the background without manual intervention
 */

let schedulerInterval: NodeJS.Timeout | null = null
let isRunning = false

/**
 * Start the email scheduler
 * Automatically checks for pending emails every minute
 */
export function startEmailScheduler() {
  if (isRunning) {
    console.log('📧 Email scheduler is already running')
    return
  }

  console.log('🚀 Starting automatic email scheduler...')
  isRunning = true

  // Run immediately on start
  checkAndSendEmails()

  // Then run every minute
  schedulerInterval = setInterval(() => {
    checkAndSendEmails()
  }, 60 * 1000) // Every 60 seconds (1 minute)

  console.log('✅ Email scheduler started - will check for pending emails every minute')
}

/**
 * Stop the email scheduler
 */
export function stopEmailScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    isRunning = false
    console.log('🛑 Email scheduler stopped')
  }
}

/**
 * Check and send pending emails
 */
async function checkAndSendEmails() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    const response = await fetch(`${baseUrl}/api/email/cron`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add a small timeout to prevent hanging
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (response.ok) {
      const result = await response.json()
      if (result.data?.sent > 0) {
        console.log(`📧 [Scheduler] Sent ${result.data.sent} email(s) automatically`)
      }
    } else {
      console.error('❌ [Scheduler] Failed to check emails:', response.status)
    }
  } catch (error) {
    // Silently handle errors to prevent spam in logs
    // Only log if it's not a timeout or network error
    if (error instanceof Error && !error.name.includes('Timeout') && !error.message.includes('fetch')) {
      console.error('❌ [Scheduler] Error checking emails:', error.message)
    }
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return isRunning
}
