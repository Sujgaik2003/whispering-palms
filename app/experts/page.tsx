'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GlobalFooter from '@/app/components/GlobalFooter'
import { useI18n } from '@/app/hooks/useI18n'

export default function ExpertsPage() {
    const [mounted, setMounted] = useState(false)
    const { t } = useI18n()

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <main className="min-h-screen bg-gradient-soft">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full bg-gradient-to-br from-gold-50/95 via-ivory-100/95 to-gold-50/95 backdrop-blur-lg border-b border-gold-200/30 shadow-soft">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="text-2xl font-bold text-text-primary">← {t('dashboard.title')}</span>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className={`bg-white rounded-2xl shadow-soft-lg p-8 md:p-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-gold-100 rounded-full text-gold-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-text-primary">Expert Astrologers</h1>
                    </div>

                    <p className="text-text-secondary text-lg leading-relaxed mb-8">
                        Our platform connects you with seasoned experts in Vedic astrology and palmistry with decades of combined experience in ancient wisdom and modern interpretation.
                    </p>

                    <div className="prose prose-lg max-w-none space-y-12">
                        <section>
                            <h2 className="text-2xl font-semibold text-text-primary mb-4">Vetted Professionalism</h2>
                            <p className="text-text-secondary leading-relaxed">
                                Every astrologer and palmist contributing to Whispering Palms undergoes a rigorous vetting process. We ensure they possess deep knowledge of traditional Vedic texts and have a proven track record of providing insightful, compassionate guidance to thousands of seekers worldwide.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-text-primary mb-4">Ancient Wisdom, Modern Delivery</h2>
                            <p className="text-text-secondary leading-relaxed">
                                While our experts have mastered centuries-old techniques, they utilize Whispering Palms' cutting-edge technology to deliver readings that are more accurate, personalized, and timely than ever before. This synergy allows us to provide deep insights on-demand while maintaining the human touch.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-text-primary mb-4">Personalized Consultation</h2>
                            <p className="text-text-secondary leading-relaxed">
                                When you ask a question on Whispering Palms, you aren't just getting a generic response. Our experts analyze your unique birth chart (Kundli) and palm lines specifically for your situation, providing guidance that resonates with your personal life path and current planetary influences.
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 p-8 bg-gradient-to-br from-gold-50 to-peach-50 rounded-2xl border border-gold-200 text-center">
                        <h3 className="text-xl font-bold text-text-primary mb-2">Ready for your reading?</h3>
                        <p className="text-text-secondary mb-6">Ask our experts anything about your love life, career, or spiritual path.</p>
                        <Link
                            href="/register"
                            className="inline-block px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-soft-lg"
                        >
                            Get Started Now
                        </Link>
                    </div>
                </div>

                <GlobalFooter />
            </div>
        </main>
    )
}
