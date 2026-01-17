'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QuestionPanel from '@/app/components/QuestionPanel'
import { useI18n } from '@/app/hooks/useI18n'

export default function ChatPage() {
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <main className="h-screen flex flex-col bg-gradient-soft">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-beige-300/50 shadow-soft">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Link
                href="/dashboard"
                className="p-1.5 sm:p-2 text-text-tertiary hover:text-text-primary hover:bg-beige-50 rounded-lg transition-all flex-shrink-0"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg sm:rounded-xl shadow-soft flex-shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary font-serif truncate">{t('chat.askYourQuestion')}</h1>
                  <p className="text-xs sm:text-sm text-text-secondary hidden sm:block">{t('chat.submitQuestionDesc')}</p>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-white border-2 border-beige-300 hover:border-gold-400 text-text-primary rounded-lg sm:rounded-xl transition-all font-semibold shadow-soft hover:shadow-soft-lg flex items-center gap-1.5 sm:gap-2 flex-shrink-0 text-xs sm:text-sm md:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden sm:inline">{t('chat.dashboard')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Question Panel Component */}
      <div className="flex-1 overflow-hidden">
        <QuestionPanel />
      </div>
    </main>
  )
}
