'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GlobalFooter from '@/app/components/GlobalFooter'
import { useI18n } from '@/app/hooks/useI18n'

export default function KnowledgePage() {
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-text-primary">Vedic Wisdom</h1>
                    </div>

                    <p className="text-text-secondary text-lg leading-relaxed mb-8">
                        Explore the timeless wisdom of the Vedas and the ancient science of palmistry that has guided humanity for thousands of years.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div className="p-6 bg-gold-50 rounded-2xl border border-gold-100">
                            <h3 className="text-xl font-bold text-text-primary mb-3">Vedic Astrology (Jyotish)</h3>
                            <p className="text-text-secondary leading-relaxed text-sm">
                                Known as the "Eye of the Vedas," Jyotish is the study of celestial bodies and light patterns at the moment of birth. It provides a deep map of your karma and destiny through the analysis of planets (Grahas), zodiac signs (Rashis), and lunar mansions (Nakshatras).
                            </p>
                        </div>
                        <div className="p-6 bg-peach-50 rounded-2xl border border-peach-100">
                            <h3 className="text-xl font-bold text-text-primary mb-3">Palmistry (Hast Jyotish)</h3>
                            <p className="text-text-secondary leading-relaxed text-sm">
                                Your hands provide a blueprint of your personality, potential, and future tendencies. Lines on your palm (Life, Heart, Head) and the mounts beneath your fingers tell a unique story of your past experiences and upcoming opportunities.
                            </p>
                        </div>
                    </div>

                    <div className="prose prose-lg max-w-none space-y-12">
                        <section>
                            <h2 className="text-2xl font-semibold text-text-primary mb-4">The Five Elements (Pancha Bhoota)</h2>
                            <p className="text-text-secondary leading-relaxed">
                                Both palmistry and astrology are rooted in the fundamental balance of Earth, Water, Fire, Air, and Ether. Our readings help you understand which elements are dominant in your life and how to harmonize them to achieve success and inner peace.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-text-primary mb-4">Karma and Free Will</h2>
                            <p className="text-text-secondary leading-relaxed">
                                Vedic wisdom teaches that while our past actions (Karma) influence our present circumstances, we have the power of choice. Insights from Whispering Palms help you navigate your destiny by highlighting favorable times (Dashas) and identifying potential challenges before they arise.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-text-primary mb-4">Modern Application</h2>
                            <p className="text-text-secondary leading-relaxed">
                                In today's fast-paced world, these ancient sciences are more relevant than ever. They provide a sense of perspective, helping us understand that everything in the universe is interconnected and that there is a cosmic order to our life journeys.
                            </p>
                        </section>
                    </div>
                </div>

                <GlobalFooter />
            </div>
        </main>
    )
}
