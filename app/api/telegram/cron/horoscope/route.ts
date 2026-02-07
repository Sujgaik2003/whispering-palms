/**
 * Telegram Daily Horoscope Cron Job
 * POST /api/telegram/cron/horoscope
 * 
 * Called by external cron service (e.g., Vercel Cron, cron-job.org)
 * to send daily horoscopes to all subscribers
 * 
 * Recommended schedule: 9:00 AM IST daily
 */

import { NextRequest, NextResponse } from 'next/server'
import { telegramBotService } from '@/lib/services/telegram-bot'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max for all messages

export async function POST(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('Authorization')
        const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_API_TOKEN || 'whispering-palms-cron'

        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            console.error('[Telegram Cron] Unauthorized cron request')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('[Telegram Cron] Starting daily horoscope broadcast...')

        const result = await telegramBotService.sendDailyHoroscopes()

        console.log(`[Telegram Cron] Daily horoscopes sent: ${result.sent} success, ${result.errors} errors`)

        return NextResponse.json({
            success: true,
            message: 'Daily horoscopes sent',
            sent: result.sent,
            errors: result.errors,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[Telegram Cron] Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to send daily horoscopes'
        }, { status: 500 })
    }
}

// Allow GET for health check
export async function GET() {
    return NextResponse.json({
        endpoint: 'Daily Horoscope Cron',
        status: 'ready',
        description: 'POST to this endpoint to trigger daily horoscope delivery',
    })
}
