/**
 * Telegram Bot Webhook Handler
 * POST /api/telegram/webhook
 * 
 * This endpoint receives updates from Telegram Bot API
 * Webhook URL: https://whispering-palms.org/api/telegram/webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { telegramBotService } from '@/lib/services/telegram-bot'

// Verify webhook secret (optional but recommended)
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
    try {
        // Optional: Verify webhook secret from header
        const secretHeader = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
        if (WEBHOOK_SECRET && secretHeader !== WEBHOOK_SECRET) {
            console.error('[Telegram Webhook] Invalid secret token')
            return NextResponse.json({ ok: false }, { status: 401 })
        }

        const update = await request.json()
        console.log('[Telegram Webhook] Received update:', JSON.stringify(update, null, 2))

        // Process update
        try {
            await telegramBotService.handleUpdate(update)
        } catch (error) {
            console.error('[Telegram Webhook] Handler error:', error)
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('[Telegram Webhook] Error:', error)
        return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
    }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
    const info = await telegramBotService.getWebhookInfo()
    return NextResponse.json({
        message: 'Telegram Bot Webhook Endpoint',
        webhookInfo: info,
    })
}
