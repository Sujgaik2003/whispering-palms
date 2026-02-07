/**
 * Telegram Bot Manual Test Script
 * 
 * Usage: npx tsx scripts/test-telegram-bot.ts
 */

import 'dotenv/config'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

async function testBot() {
    console.log('🤖 Testing Telegram Bot Configuration\n')

    // 1. Check bot token
    if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        console.error('❌ TELEGRAM_BOT_TOKEN not set in .env.local')
        console.log('   Get a token from @BotFather on Telegram')
        return
    }
    console.log('✅ Bot token is configured')

    // 2. Get bot info
    console.log('\n📡 Getting bot info...')
    try {
        const response = await fetch(`${BASE_URL}/getMe`)
        const data = await response.json()

        if (data.ok) {
            console.log('✅ Bot connected successfully!')
            console.log(`   Name: ${data.result.first_name}`)
            console.log(`   Username: @${data.result.username}`)
            console.log(`   Bot ID: ${data.result.id}`)
        } else {
            console.error('❌ Failed to connect to bot:', data.description)
            return
        }
    } catch (error) {
        console.error('❌ Connection error:', error)
        return
    }

    // 3. Check webhook status
    console.log('\n🔗 Checking webhook...')
    try {
        const response = await fetch(`${BASE_URL}/getWebhookInfo`)
        const data = await response.json()

        if (data.ok) {
            console.log(`   URL: ${data.result.url || 'Not set'}`)
            console.log(`   Pending updates: ${data.result.pending_update_count}`)
            console.log(`   Last error: ${data.result.last_error_message || 'None'}`)

            if (!data.result.url) {
                console.log('\n⚠️  Webhook not set. Run this to set it:')
                console.log(`   curl "${BASE_URL}/setWebhook?url=https://whispering-palms.org/api/telegram/webhook"`)
            }
        }
    } catch (error) {
        console.error('❌ Failed to get webhook info:', error)
    }

    // 4. Test message sending (optional)
    const testChatId = process.argv[2]
    if (testChatId) {
        console.log(`\n📤 Sending test message to chat ${testChatId}...`)
        try {
            const response = await fetch(`${BASE_URL}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: testChatId,
                    text: '🌿 *Test Message from Whispering Palms*\n\nIf you see this, the bot is working correctly!',
                    parse_mode: 'Markdown',
                }),
            })
            const data = await response.json()

            if (data.ok) {
                console.log('✅ Test message sent successfully!')
            } else {
                console.error('❌ Failed to send message:', data.description)
            }
        } catch (error) {
            console.error('❌ Send error:', error)
        }
    } else {
        console.log('\n💡 To test sending a message, run:')
        console.log('   npx tsx scripts/test-telegram-bot.ts YOUR_TELEGRAM_USER_ID')
        console.log('   (Get your ID by messaging @userinfobot on Telegram)')
    }

    console.log('\n✨ Bot test complete!')
}

testBot().catch(console.error)
