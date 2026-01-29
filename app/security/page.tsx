'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GlobalFooter from '@/app/components/GlobalFooter'
import { useI18n } from '@/app/hooks/useI18n'

export default function SecurityPage() {
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-text-primary">Secure & Private</h1>
                    </div>

                    <p className="text-text-secondary text-lg leading-relaxed mb-8">
                        Your spiritual journey is personal and private. At Whispering Palms, we prioritize the security and confidentiality of your birth details and palm images above all else.
                    </p>

                    <div className="prose prose-lg max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-semibold text-text-primary mb-4">1. Enterprise-Grade Encryption</h2>
                            <p className="text-text-secondary leading-relaxed">
                                All data transmitted between your device and our servers is encrypted using industry-standard AES-256 encryption. This ensures that your personal information and uploaded images remain confidential during transit and while stored on our secure servers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-text-primary mb-4">2. Private Image Storage</h2>
                            <p className="text-text-secondary leading-relaxed">
                                Your palm images are stored in isolated, secure buckets with restricted access. They are only used for the purposes of generating your personalized reading and verifying your identity during the matching process. We never share your images with third parties or use them for training public models.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-text-primary mb-4">3. Confidential Readings</h2>
                            <p className="text-text-secondary leading-relaxed">
                                All readings generated on Whispering Palms are private and delivered directly to you. Our experts follow strict confidentiality protocols, and your data is never sold or traded with advertising networks or marketing partners.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-text-primary mb-4">4. You Own Your Data</h2>
                            <p className="text-text-secondary leading-relaxed">
                                You have full control over your profile and data. You can update your birth details or request the permanent deletion of your account and all associated palm images at any time through your settings page.
                            </p>
                        </section>
                    </div>
                </div>

                <GlobalFooter />
            </div>
        </main>
    )
}
