'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/app/hooks/useI18n'

interface HoroscopeData {
    prediction: string
    luckyNumber: number
    luckyColor: string
    luckyColorHex: string
    luckyTime: string
    mood: string
    moodEmoji: string
    compatibility: string
    zodiacSign: string
    zodiacEmoji: string
    date: string
    element: string
    lastUpdated: string
}

// Zodiac signs with their properties
const ZODIAC_SIGNS: Record<string, { emoji: string; element: string; color: string }> = {
    'aries': { emoji: '♈', element: 'Fire', color: '#FF4136' },
    'taurus': { emoji: '♉', element: 'Earth', color: '#2ECC40' },
    'gemini': { emoji: '♊', element: 'Air', color: '#FFDC00' },
    'cancer': { emoji: '♋', element: 'Water', color: '#0074D9' },
    'leo': { emoji: '♌', element: 'Fire', color: '#FF851B' },
    'virgo': { emoji: '♍', element: 'Earth', color: '#3D9970' },
    'libra': { emoji: '♎', element: 'Air', color: '#F012BE' },
    'scorpio': { emoji: '♏', element: 'Water', color: '#85144b' },
    'sagittarius': { emoji: '♐', element: 'Fire', color: '#7FDBFF' },
    'capricorn': { emoji: '♑', element: 'Earth', color: '#001f3f' },
    'aquarius': { emoji: '♒', element: 'Air', color: '#39CCCC' },
    'pisces': { emoji: '♓', element: 'Water', color: '#B10DC9' },
}

export default function DailyHoroscope() {
    const { t, language } = useI18n()
    const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const fetchHoroscope = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/horoscope/daily?lang=${language}`)
            const result = await response.json()

            if (response.ok && result.success) {
                setHoroscope(result.data)
            } else {
                setError(result.error || 'Failed to load horoscope')
            }
        } catch (err) {
            setError('Unable to fetch your daily horoscope')
            console.error('[DailyHoroscope] Error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHoroscope()
    }, [language])

    // Loading skeleton
    if (loading && !horoscope) {
        return (
            <div className="group relative min-h-[200px] sm:min-h-[220px] bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-indigo-200 shadow-soft-xl overflow-hidden animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-200 rounded-xl"></div>
                    <div className="flex-1">
                        <div className="h-5 bg-indigo-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-indigo-100 rounded w-1/3"></div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-indigo-100 rounded w-full"></div>
                    <div className="h-4 bg-indigo-100 rounded w-5/6"></div>
                    <div className="h-4 bg-indigo-100 rounded w-4/6"></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="h-16 bg-indigo-100 rounded-xl"></div>
                    <div className="h-16 bg-indigo-100 rounded-xl"></div>
                    <div className="h-16 bg-indigo-100 rounded-xl"></div>
                </div>
            </div>
        )
    }

    // Error state
    if (error && !horoscope) {
        return (
            <div className="group relative min-h-[180px] bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-red-200 shadow-soft-xl">
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="p-4 bg-red-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-red-600 font-medium mb-4">{error}</p>
                    <button
                        onClick={() => fetchHoroscope()}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    if (!horoscope) return null

    const zodiacInfo = ZODIAC_SIGNS[horoscope.zodiacSign.toLowerCase()] || ZODIAC_SIGNS['aries']

    return (
        <div className="group relative min-h-[200px] sm:min-h-[220px] bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 hover:from-indigo-100 hover:via-purple-100 hover:to-violet-100 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 border-2 border-indigo-200 hover:border-indigo-400 shadow-soft-xl hover:shadow-[0_25px_70px_rgba(99,102,241,0.25)] transition-all duration-700 hover:-translate-y-1 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-violet-200/30 to-indigo-200/30 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>

            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 rounded-3xl opacity-0 group-hover:opacity-15 blur-2xl transition-opacity duration-700"></div>

            {/* Stars animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-4 right-8 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse-star" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-12 right-20 w-1 h-1 bg-yellow-200 rounded-full animate-pulse-star" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-6 right-32 w-1 h-1 bg-indigo-300 rounded-full animate-pulse-star" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-8 right-12 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse-star" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Zodiac icon */}
                        <div
                            className="p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-soft-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                            style={{ background: `linear-gradient(135deg, ${zodiacInfo.color}dd, ${zodiacInfo.color}99)` }}
                        >
                            <span className="text-2xl sm:text-3xl text-white filter drop-shadow-lg">{zodiacInfo.emoji}</span>
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-text-primary flex items-center gap-2">
                                {t('horoscope.dailyHoroscope') || 'Daily Horoscope'}
                                <span className="text-xl sm:text-2xl">{horoscope.moodEmoji}</span>
                            </h3>
                            <div className="flex items-center gap-2 text-text-secondary text-xs sm:text-sm">
                                <span className="font-semibold text-indigo-600 capitalize">{horoscope.zodiacSign}</span>
                                <span className="text-indigo-300">•</span>
                                <span>{horoscope.element}</span>
                                <span className="text-indigo-300">•</span>
                                <span>{new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prediction text */}
                <div className="mb-4 sm:mb-5">
                    <p className={`text-text-secondary text-sm sm:text-base leading-relaxed ${!isExpanded && horoscope.prediction.length > 150 ? 'line-clamp-3' : ''}`}>
                        {horoscope.prediction}
                    </p>
                    {horoscope.prediction.length > 150 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2 flex items-center gap-1"
                        >
                            {isExpanded ? (t('common.showLess') || 'Show less') : (t('common.readMore') || 'Read more')}
                            <svg
                                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Lucky items grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {/* Lucky Number */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-indigo-100 hover:border-indigo-300 transition-colors text-center group/item">
                        <div className="text-xl sm:text-2xl font-bold text-indigo-600 group-hover/item:scale-110 transition-transform">
                            {horoscope.luckyNumber}
                        </div>
                        <div className="text-text-secondary text-xs sm:text-sm mt-1">
                            {t('horoscope.luckyNumber') || 'Lucky Number'}
                        </div>
                    </div>

                    {/* Lucky Color */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-indigo-100 hover:border-indigo-300 transition-colors text-center group/item">
                        <div className="flex items-center justify-center gap-2">
                            <div
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-inner border-2 border-white group-hover/item:scale-125 transition-transform"
                                style={{ backgroundColor: horoscope.luckyColorHex }}
                            ></div>
                            <span className="text-sm sm:text-base font-semibold text-text-primary capitalize">{horoscope.luckyColor}</span>
                        </div>
                        <div className="text-text-secondary text-xs sm:text-sm mt-1">
                            {t('horoscope.luckyColor') || 'Lucky Color'}
                        </div>
                    </div>

                    {/* Lucky Time */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-indigo-100 hover:border-indigo-300 transition-colors text-center group/item">
                        <div className="text-lg sm:text-xl font-bold text-purple-600 group-hover/item:scale-110 transition-transform">
                            {horoscope.luckyTime}
                        </div>
                        <div className="text-text-secondary text-xs sm:text-sm mt-1">
                            {t('horoscope.luckyTime') || 'Lucky Time'}
                        </div>
                    </div>

                    {/* Mood */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-indigo-100 hover:border-indigo-300 transition-colors text-center group/item">
                        <div className="text-xl sm:text-2xl mb-0.5 group-hover/item:scale-125 transition-transform">
                            {horoscope.moodEmoji}
                        </div>
                        <div className="text-sm font-medium text-text-primary capitalize">{horoscope.mood}</div>
                        <div className="text-text-secondary text-xs mt-0.5">
                            {t('horoscope.mood') || 'Mood'}
                        </div>
                    </div>
                </div>

                {/* Compatibility hint */}
                <div className="mt-4 sm:mt-5 flex items-center justify-between text-xs sm:text-sm text-text-secondary bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-indigo-100">
                    <div className="flex items-center gap-2">
                        <span className="text-pink-500">💕</span>
                        <span>{t('horoscope.bestCompatibility') || 'Best compatibility today'}:</span>
                        <span className="font-semibold text-pink-600">{horoscope.compatibility}</span>
                    </div>
                    <div className="text-indigo-400 text-xs hidden sm:block">
                        {t('horoscope.updatedAt') || 'Updated'}: {new Date(horoscope.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        </div>
    )
}
