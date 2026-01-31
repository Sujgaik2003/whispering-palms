'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GlobalFooter from '@/app/components/GlobalFooter'
import { useI18n } from '@/app/hooks/useI18n'

export default function AboutPage() {
    const [mounted, setMounted] = useState(false)
    const { t } = useI18n()

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <main className="min-h-screen bg-gradient-soft">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-96 h-96 bg-peach-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float"></div>
                <div className="absolute bottom-40 left-10 w-96 h-96 bg-gold-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sage-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-soft"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 w-full bg-gradient-to-br from-gold-50/95 via-ivory-100/95 to-gold-50/95 backdrop-blur-lg border-b border-gold-200/30 shadow-soft">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="text-2xl font-bold text-text-primary">← {t('dashboard.title')}</span>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className={`text-center mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                        About Us
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto rounded-full"></div>
                    <p className="text-lg md:text-xl text-text-secondary mt-6 max-w-2xl mx-auto">
                        Bridging ancient Vedic wisdom with modern technology to illuminate your path
                    </p>
                </div>

                {/* Main Content Card */}
                <div className={`bg-white rounded-2xl shadow-soft-lg p-8 md:p-12 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

                    {/* Mission Section */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary">Our Mission</h2>
                        </div>
                        <p className="text-text-secondary leading-relaxed text-lg">
                            At <span className="font-semibold text-gold-600">Whispering Palms</span>, we are dedicated to making the profound wisdom of Vedic astrology and palmistry accessible to everyone. Our mission is to guide individuals on their spiritual journey by combining centuries-old Indian traditions with cutting-edge technology, providing personalized insights that help people understand their true potential and life path.
                        </p>
                    </section>

                    {/* What We Do Section */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-sage-400 to-sage-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary">What We Offer</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-peach-50 to-peach-100 rounded-xl p-6 border border-peach-200 hover:shadow-soft transition-all duration-300">
                                <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                                    <span className="text-peach-600">✨</span> Vedic Astrology
                                </h3>
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    Comprehensive birth chart analysis based on your exact time and place of birth, revealing insights about your personality, career, relationships, and life events.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-sage-50 to-sage-100 rounded-xl p-6 border border-sage-200 hover:shadow-soft transition-all duration-300">
                                <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                                    <span className="text-sage-600">🖐️</span> Palm Reading
                                </h3>
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    Expert palmistry analysis from your palm images, uncovering the secrets written in your hands about health, wealth, and destiny.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-xl p-6 border border-gold-200 hover:shadow-soft transition-all duration-300">
                                <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                                    <span className="text-gold-600">💬</span> Personalized Guidance
                                </h3>
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    Ask questions and receive detailed, personalized answers from our expert astrologer delivered directly to your email.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-ivory-50 to-ivory-100 rounded-xl p-6 border border-beige-200 hover:shadow-soft transition-all duration-300">
                                <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                                    <span className="text-gold-600">🔒</span> Privacy First
                                </h3>
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    Your birth details and palm images are stored securely with industry-standard encryption. Your spiritual journey remains private.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Our Story Section */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-peach-400 to-peach-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary">Our Story</h2>
                        </div>
                        <p className="text-text-secondary leading-relaxed mb-4">
                            Whispering Palms was born from a deep respect for India's ancient spiritual traditions and a vision to make these invaluable insights accessible in the digital age. Our founder, inspired by generations of Vedic scholars and palmistry experts, embarked on a journey to create a platform where traditional wisdom meets modern convenience.
                        </p>
                        <p className="text-text-secondary leading-relaxed">
                            Today, we serve thousands of seekers worldwide, helping them navigate life's challenges with the guidance of the stars and the wisdom written in their palms. Every reading we provide is crafted with care, combining algorithmic precision with the intuitive expertise of our seasoned astrologer.
                        </p>
                    </section>

                    {/* Why Choose Us */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary">Why Choose Whispering Palms?</h2>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="text-gold-500 mt-1">✓</span>
                                <p className="text-text-secondary"><span className="font-semibold text-text-primary">Authentic Vedic Knowledge:</span> Our readings are based on genuine Vedic astrology principles passed down through generations.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-gold-500 mt-1">✓</span>
                                <p className="text-text-secondary"><span className="font-semibold text-text-primary">Expert Analysis:</span> Every question is answered by our experienced astrologer with decades of practice.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-gold-500 mt-1">✓</span>
                                <p className="text-text-secondary"><span className="font-semibold text-text-primary">User-Friendly Experience:</span> Modern technology makes it easy to get insights without complex rituals or in-person visits.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-gold-500 mt-1">✓</span>
                                <p className="text-text-secondary"><span className="font-semibold text-text-primary">Multilingual Support:</span> Available in multiple languages to serve our global community.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-gold-500 mt-1">✓</span>
                                <p className="text-text-secondary"><span className="font-semibold text-text-primary">Secure & Confidential:</span> Your personal data and spiritual journey remain completely private and protected.</p>
                            </li>
                        </ul>
                    </section>

                    {/* Contact Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-sage-400 to-sage-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary">Contact Us</h2>
                        </div>
                        <p className="text-text-secondary leading-relaxed mb-6">
                            We would love to hear from you! Whether you have questions about our services, need support, or just want to share your experience, feel free to reach out.
                        </p>
                        <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-xl p-8 border border-gold-200">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-tertiary">Email</p>
                                        <a href="mailto:admin@whispering-palms.org" className="text-lg font-semibold text-gold-600 hover:text-gold-700 transition-colors">
                                            admin@whispering-palms.org
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-sage-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-tertiary">Response Time</p>
                                        <p className="text-lg font-semibold text-text-primary">Within 24-48 hours</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* CTA Section */}
                <div className={`text-center mt-12 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <p className="text-text-secondary mb-6">Ready to discover what the stars have in store for you?</p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-soft-lg"
                    >
                        Start Your Journey
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>

                <GlobalFooter />
            </div>
        </main>
    )
}
