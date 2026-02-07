/**
 * Telegram Nurturing Campaign Cron Job
 * POST /api/telegram/cron/nurture
 * 
 * Called by external cron service to send nurturing messages
 * based on days since signup
 * 
 * Recommended schedule: 2:00 PM IST daily
 */

import { NextRequest, NextResponse } from 'next/server'
import { telegramBotService } from '@/lib/services/telegram-bot'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

export async function POST(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('Authorization')
        const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_API_TOKEN || 'whispering-palms-cron'

        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            console.error('[Telegram Nurture Cron] Unauthorized request')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('[Telegram Nurture Cron] Starting nurturing campaign...')

        const result = await telegramBotService.sendNurturingMessages()

        console.log(`[Telegram Nurture Cron] Nurturing messages sent: ${result.sent} success, ${result.errors} errors`)

        return NextResponse.json({
            success: true,
            message: 'Nurturing messages sent',
            sent: result.sent,
            errors: result.errors,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[Telegram Nurture Cron] Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to send nurturing messages'
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        endpoint: 'Nurturing Campaign Cron',
        status: 'ready',
        description: 'POST to this endpoint to trigger nurturing message delivery',
    })
}
