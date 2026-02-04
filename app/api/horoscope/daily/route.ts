/**
 * Daily Horoscope API
 * GET /api/horoscope/daily
 * 
 * Returns personalized daily horoscope based on user's birth date
 * Uses LLM to generate predictions in user's preferred language
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { anythingLLMService } from '@/lib/services/anythingllm'

// Zodiac sign determination based on birth date
function getZodiacSign(month: number, day: number): { sign: string; element: string } {
    const zodiacSigns = [
        { sign: 'capricorn', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19, element: 'Earth' },
        { sign: 'aquarius', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18, element: 'Air' },
        { sign: 'pisces', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20, element: 'Water' },
        { sign: 'aries', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19, element: 'Fire' },
        { sign: 'taurus', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20, element: 'Earth' },
        { sign: 'gemini', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20, element: 'Air' },
        { sign: 'cancer', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22, element: 'Water' },
        { sign: 'leo', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22, element: 'Fire' },
        { sign: 'virgo', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22, element: 'Earth' },
        { sign: 'libra', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22, element: 'Air' },
        { sign: 'scorpio', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21, element: 'Water' },
        { sign: 'sagittarius', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21, element: 'Fire' },
    ]

    for (const zodiac of zodiacSigns) {
        if (zodiac.sign === 'capricorn') {
            // Special case: Capricorn spans December-January
            if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
                return { sign: zodiac.sign, element: zodiac.element }
            }
        } else {
            if (
                (month === zodiac.startMonth && day >= zodiac.startDay) ||
                (month === zodiac.endMonth && day <= zodiac.endDay)
            ) {
                return { sign: zodiac.sign, element: zodiac.element }
            }
        }
    }

    return { sign: 'aries', element: 'Fire' } // Default fallback
}

// Lucky color data with hex codes
const LUCKY_COLORS = [
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Red', hex: '#FF4136' },
    { name: 'Blue', hex: '#0074D9' },
    { name: 'Green', hex: '#2ECC40' },
    { name: 'Purple', hex: '#B10DC9' },
    { name: 'Orange', hex: '#FF851B' },
    { name: 'Pink', hex: '#FF69B4' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Yellow', hex: '#FFDC00' },
    { name: 'Turquoise', hex: '#40E0D0' },
    { name: 'Lavender', hex: '#E6E6FA' },
]

// Mood options with emojis
const MOODS = [
    { mood: 'Energetic', emoji: '⚡' },
    { mood: 'Peaceful', emoji: '☮️' },
    { mood: 'Romantic', emoji: '💕' },
    { mood: 'Creative', emoji: '🎨' },
    { mood: 'Ambitious', emoji: '🚀' },
    { mood: 'Reflective', emoji: '🪷' },
    { mood: 'Adventurous', emoji: '🌟' },
    { mood: 'Calm', emoji: '🧘' },
    { mood: 'Joyful', emoji: '😊' },
    { mood: 'Focused', emoji: '🎯' },
]

// Compatible signs mapping
const COMPATIBILITY: Record<string, string[]> = {
    'aries': ['Leo', 'Sagittarius', 'Gemini'],
    'taurus': ['Virgo', 'Capricorn', 'Cancer'],
    'gemini': ['Libra', 'Aquarius', 'Aries'],
    'cancer': ['Scorpio', 'Pisces', 'Taurus'],
    'leo': ['Aries', 'Sagittarius', 'Gemini'],
    'virgo': ['Taurus', 'Capricorn', 'Cancer'],
    'libra': ['Gemini', 'Aquarius', 'Leo'],
    'scorpio': ['Cancer', 'Pisces', 'Virgo'],
    'sagittarius': ['Aries', 'Leo', 'Libra'],
    'capricorn': ['Taurus', 'Virgo', 'Scorpio'],
    'aquarius': ['Gemini', 'Libra', 'Sagittarius'],
    'pisces': ['Cancer', 'Scorpio', 'Capricorn'],
}

// Generate lucky time
function generateLuckyTime(): string {
    const hour = Math.floor(Math.random() * 12) + 1
    const minutes = ['00', '15', '30', '45'][Math.floor(Math.random() * 4)]
    const period = Math.random() > 0.5 ? 'AM' : 'PM'
    return `${hour}:${minutes} ${period}`
}

// Cache key for today's horoscope
function getTodaysCacheKey(userId: string): string {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    return `horoscope_${userId}_${today}`
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const refresh = request.nextUrl.searchParams.get('refresh') === 'true'

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get user data for language preference and name
        const { data: userData } = await supabase
            .from('users')
            .select('name, preferred_language')
            .eq('id', user.id)
            .single()

        const preferredLanguage = request.nextUrl.searchParams.get('lang') || userData?.preferred_language || 'en'
        const userName = userData?.name || 'Dear one'

        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const cacheKey = `horoscope_${user.id}_${preferredLanguage}_${today}`

        // Check cache first
        const { data: cachedData } = await supabase
            .from('horoscope_cache')
            .select('horoscope_data')
            .eq('cache_key', cacheKey)
            .single()

        if (cachedData) {
            console.log('[Horoscope] Returning cached data for today')
            return NextResponse.json({
                success: true,
                data: cachedData.horoscope_data,
                cached: true
            })
        }

        // Get user profile with birth date and preferred language
        // Get user profile with birth date
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('date_of_birth, time_of_birth, place_of_birth')
            .eq('user_id', user.id)
            .single()

        // Get workspace ID or create one if missing
        let { data: workspace } = await supabase
            .from('anythingllm_workspaces')
            .select('workspace_id')
            .eq('user_id', user.id)
            .single()

        let workspaceId = workspace?.workspace_id

        if (!workspaceId) {
            console.log('[Horoscope] No workspace found, creating one...')
            try {
                workspaceId = await anythingLLMService.createWorkspace(user.id, userName)
                await supabase.from('anythingllm_workspaces').insert({
                    user_id: user.id,
                    workspace_id: workspaceId
                })
            } catch (err) {
                console.error('[Horoscope] Failed to create workspace:', err)
                workspaceId = process.env.ANYTHINGLLM_WORKSPACE_SLUG || 'whispering-palms'
            }
        }



        if (!profile?.date_of_birth) {
            return NextResponse.json(
                { success: false, error: 'Birth date not set. Please complete your profile.' },
                { status: 400 }
            )
        }

        const birthDate = new Date(profile.date_of_birth)
        const { sign: zodiacSign, element } = getZodiacSign(birthDate.getMonth() + 1, birthDate.getDate())


        // 3. Generate Horoscope using LLM

        // Calculate daily lucky elements (stable random based on date + user)
        // We use a simple hash of date + user_id to select lucky elements
        // This ensures they stay the same for the day even if we re-generate the text
        const seed = (new Date(today).getTime() + user.id.charCodeAt(0))

        const generateLuckyNumber = () => Math.floor((seed % 9) + 1)
        const generateLuckyColor = () => {
            const colors = [
                { name: 'Red', hex: '#FF5252' },
                { name: 'Blue', hex: '#448AFF' },
                { name: 'Green', hex: '#69F0AE' },
                { name: 'Yellow', hex: '#FFFF00' },
                { name: 'Purple', hex: '#E040FB' },
                { name: 'Orange', hex: '#FFAB40' },
                { name: 'Pink', hex: '#FF4081' },
                { name: 'White', hex: '#FFFFFF' },
                { name: 'Gold', hex: '#FFD700' },
                { name: 'Silver', hex: '#C0C0C0' },
            ]
            return colors[seed % colors.length]
        }
        const generateMood = () => {
            const moods = [
                { mood: 'Optimistic', emoji: '✨' },
                { mood: 'Focused', emoji: '🎯' },
                { mood: 'Relaxed', emoji: '😌' },
                { mood: 'Creative', emoji: '🎨' },
                { mood: 'Energetic', emoji: '⚡' },
                { mood: 'Reflective', emoji: '🌙' },
                { mood: 'Social', emoji: '🤝' },
                { mood: 'Romantic', emoji: '💖' },
            ]
            return moods[seed % moods.length]
        }
        const generateLuckyTime = () => {
            const hour = (seed % 12) + 1
            const ampm = seed % 2 === 0 ? 'AM' : 'PM'
            return `${hour}:00 ${ampm}`
        }

        const luckyNumber = generateLuckyNumber()
        const luckyColorData = generateLuckyColor()
        const moodData = generateMood()
        const luckyTime = generateLuckyTime()
        const compatibleSigns = COMPATIBILITY[zodiacSign] || ['Leo', 'Sagittarius']
        const todaysCompatibility = compatibleSigns[seed % compatibleSigns.length]

        // Call AnythingLLM or Gemini for prediction
        let prediction = ''

        try {
            const systemPrompt = `You are a helpful astrological assistant. Provide concise and insightful horoscopes based on the zodiac sign and requested details.`
            const userMessage = `Generate a personalized daily horoscope for ${userName} who is a ${zodiacSign} (${element} sign). Today's date is ${new Date().toLocaleDateString()}. 
          
The horoscope should be:
- Positive and uplifting
- Around 2-3 sentences
- Mention aspects like career, relationships, or personal growth
- ${preferredLanguage !== 'en' ? `Written in ${getLanguageName(preferredLanguage)} language` : 'Written in English'}

Just provide the horoscope text, nothing else. No greetings or sign name.`

            const llmResponse = await anythingLLMService.chat(
                workspaceId,
                userMessage,
                systemPrompt
            )

            prediction = llmResponse.response || ''

        } catch (llmError) {
            console.error('[Horoscope] LLM error:', llmError)
        }

        if (!prediction) {
            console.error('[Horoscope] Failed to generate prediction from LLM')
            return NextResponse.json(
                { error: 'Unable to read the stars right now. Please try again later.' },
                { status: 503 }
            )
        }

        // Build horoscope data
        const horoscopeData = {
            prediction: prediction.trim(),
            luckyNumber,
            luckyColor: luckyColorData.name,
            luckyColorHex: luckyColorData.hex,
            luckyTime,
            mood: moodData.mood,
            moodEmoji: moodData.emoji,
            compatibility: todaysCompatibility,
            zodiacSign: zodiacSign.charAt(0).toUpperCase() + zodiacSign.slice(1),
            zodiacEmoji: getZodiacEmoji(zodiacSign),
            element,
            date: new Date().toISOString().split('T')[0],
            lastUpdated: new Date().toISOString(),
        }

        // Cache the horoscope (create table if needed, or just use upsert)
        try {
            await supabase
                .from('horoscope_cache')
                .upsert({
                    cache_key: cacheKey,
                    user_id: user.id,
                    horoscope_data: horoscopeData,
                    created_at: new Date().toISOString(),
                }, {
                    onConflict: 'cache_key',
                })
        } catch (cacheError) {
            console.warn('[Horoscope] Cache save failed (table may not exist):', cacheError)
            // Still return success to user, even if cache failed
        }

        console.log('[Horoscope] ✅ Generated fresh horoscope')

        return NextResponse.json({
            success: true,
            data: horoscopeData,
            cached: false,
        })

    } catch (error) {
        console.error('[Horoscope] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate horoscope' },
            { status: 500 }
        )
    }
}

// Helper function to get zodiac emoji
function getZodiacEmoji(sign: string): string {
    const emojis: Record<string, string> = {
        'aries': '♈',
        'taurus': '♉',
        'gemini': '♊',
        'cancer': '♋',
        'leo': '♌',
        'virgo': '♍',
        'libra': '♎',
        'scorpio': '♏',
        'sagittarius': '♐',
        'capricorn': '♑',
        'aquarius': '♒',
        'pisces': '♓',
    }
    return emojis[sign.toLowerCase()] || '⭐'
}

// Helper function to get language name
function getLanguageName(code: string): string {
    const names: Record<string, string> = {
        'en': 'English',
        'hi': 'Hindi',
        'ar': 'Arabic',
        'ru': 'Russian',
        'zh': 'Chinese',
        'ko': 'Korean',
        'ja': 'Japanese',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
    }
    return names[code] || 'English'
}
