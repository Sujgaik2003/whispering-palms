'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import { useI18n } from '@/app/hooks/useI18n'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const { t, renderKey } = useI18n() // i18n hook for translations

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-soft">
      {/* Enhanced decorative elements with stronger colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-peach-400/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gold-400/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sage-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse-soft"></div>
      </div>

      {/* Top Navigation Bar - Sticky */}
      <nav className="sticky top-0 z-50 w-full bg-gradient-to-br from-gold-50/95 via-ivory-100/95 to-gold-50/95 backdrop-blur-lg border-b border-gold-200/30 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-300">
              <div className="p-2 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl shadow-soft">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-bold text-text-primary">{t('dashboard.title')}</span>
            </Link>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link
                href="/login"
                className="px-5 py-2.5 bg-white/90 backdrop-blur-sm border-2 border-gold-400/50 text-text-primary rounded-xl font-semibold text-sm md:text-base tracking-wide transition-all duration-300 hover:bg-white hover:border-gold-500 hover:shadow-soft hover:scale-105"
              >
                {t('auth.signInLink')}
              </Link>
              <Link
                href="/register"
                className="group relative px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold text-sm md:text-base tracking-wide transition-all duration-300 hover:scale-110 hover:shadow-soft-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gold-400 to-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t('common.getStarted')}
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto">
          {/* Logo/Title with enhanced animations */}
          <div className={`mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
            <h1 className={`text-6xl md:text-8xl lg:text-9xl font-bold mb-4  text-text-primary tracking-tight transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              {t('dashboard.title')}
            </h1>
            <div className={`h-1 w-32 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto rounded-full transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}></div>
            <p className={`text-2xl md:text-3xl text-gold-600  italic mt-6 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {t('home.astro')}
            </p>
          </div>

          {/* Tagline with staggered animations */}
          <p className={`text-xl md:text-2xl text-text-secondary mb-4 font-light leading-relaxed transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {t('home.tagline')}
          </p>
          <p className={`text-base md:text-lg text-text-tertiary mb-16 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-900 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {t('home.description')}
          </p>

          {/* Features with enhanced animations and stronger colors */}
          <div className={`grid md:grid-cols-3 gap-6 mb-16 transition-all duration-700 delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { 
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ), 
                title: t('home.astrologyInsights'), 
                desc: t('home.astrologyInsightsDesc'),
                color: "peach"
              },
              { 
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                  </svg>
                ), 
                title: t('home.palmReading'), 
                desc: t('home.palmReadingDesc'),
                color: "sage"
              },
              { 
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ), 
                title: t('home.expertGuidance'), 
                desc: t('home.expertGuidanceDesc'),
                color: "gold"
              }
            ].map((feature, idx) => {
              const colorClasses = {
                peach: {
                  bg: 'from-peach-50 to-peach-100',
                  hover: 'hover:from-peach-100 hover:to-peach-200',
                  border: 'border-peach-300 hover:border-peach-400',
                  icon: 'text-peach-600',
                  title: 'group-hover:text-peach-600'
                },
                sage: {
                  bg: 'from-sage-50 to-sage-100',
                  hover: 'hover:from-sage-100 hover:to-sage-200',
                  border: 'border-sage-300 hover:border-sage-400',
                  icon: 'text-sage-600',
                  title: 'group-hover:text-sage-600'
                },
                gold: {
                  bg: 'from-gold-50 to-gold-100',
                  hover: 'hover:from-gold-100 hover:to-gold-200',
                  border: 'border-gold-300 hover:border-gold-400',
                  icon: 'text-gold-600',
                  title: 'group-hover:text-gold-600'
                }
              }
              const colors = colorClasses[feature.color as keyof typeof colorClasses]

              return (
                <div 
                  key={idx} 
                  className={`group relative bg-gradient-to-br ${colors.bg} ${colors.hover} rounded-2xl p-8 border-2 ${colors.border} transition-all duration-500 hover:shadow-soft-lg hover:-translate-y-2 hover:scale-105 overflow-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${1100 + idx * 100}ms` }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </div>
                  <div className="relative">
                    <div className={`${colors.icon} mb-4 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 flex justify-center animate-pulse-soft`}>
                      {feature.icon}
                    </div>
                    <h3 className={`text-xl font-semibold text-text-primary mb-3  ${colors.title} transition-colors duration-300`}>{feature.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA Buttons with enhanced animations */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 transition-all duration-700 delay-1300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link
              href="/register"
              className="group relative px-10 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold text-lg tracking-wide transition-all duration-500 hover:scale-110 hover:shadow-soft-xl min-w-[200px] text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gold-400 to-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t('common.getStarted')}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>

            <Link
              href="/login"
              className="group relative px-10 py-4 bg-white/90 backdrop-blur-sm border-2 border-gold-400/50 text-text-primary rounded-xl font-semibold text-lg tracking-wide transition-all duration-500 hover:bg-white hover:border-gold-500 hover:shadow-soft-lg hover:scale-105 min-w-[200px] text-center"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t('auth.signInLink')}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </span>
            </Link>
          </div>
        </div>

        {/* Footer with animations */}
        <footer className={`mt-32 pt-8 border-t border-beige-300/50 transition-all duration-700 delay-1500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-tertiary">
            <div className="flex items-center gap-6 flex-wrap justify-center">
              {[
                { icon: 'lock', text: t('home.securePrivate') },
                { icon: 'star', text: t('home.expertAstrologer') },
                { icon: 'book', text: t('home.vedicWisdom') }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 hover:text-text-primary transition-colors duration-300 cursor-pointer group"
                >
                  {item.icon === 'lock' && (
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  {item.icon === 'star' && (
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                  {item.icon === 'book' && (
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="hover:text-text-primary transition-colors duration-300 hover:underline">
                {t('home.termsConditions')}
              </Link>
              <Link href="/privacy" className="hover:text-text-primary transition-colors duration-300 hover:underline">
                {t('home.privacyPolicy')}
              </Link>
            </div>
          </div>
          <div className="text-center mt-6 text-text-light text-xs">
            © {new Date().getFullYear()} {t('dashboard.title')} {t('home.astro')}. {t('home.copyright')}.
          </div>
        </footer>
      </div>
    </main>
  )
}
