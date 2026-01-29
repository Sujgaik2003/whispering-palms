'use client'

import { useEffect, useState } from 'react'
import Toast from './Toast'
import Link from 'next/link'
import { useI18n } from '@/app/hooks/useI18n'

interface MatchingStatus {
  overallStatus: string
  hasRequiredPalms: boolean
  hasAllPalms: boolean
  palmImages: Array<{
    id: string
    palm_type: string
    matching_status: string
    matching_score?: number
  }>
  matchingResult: {
    matching_confidence: number
    status: string
  } | null
  progress: {
    rightFront: boolean
    leftFront: boolean
    rightSide: boolean
    leftSide: boolean
  }
}

export default function PalmMatchingStatus() {
  const { t } = useI18n()
  const [status, setStatus] = useState<MatchingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  })

  useEffect(() => {
    setMounted(true)
    fetchStatus()
  }, [])

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true })
  }

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/user/profile/palm-matching-status')
      const result = await response.json()

      if (response.ok) {
        setStatus(result.data)
      }
    } catch (error) {
      console.error('Error fetching matching status:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerMatching = async () => {
    try {
      const response = await fetch('/api/palm-matching/match', {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        showToast(result.data.message || 'Matching completed successfully!', 'success')
        fetchStatus()
      } else {
        showToast(result.error?.message || 'Matching failed. Please try again.', 'error')
      }
    } catch (error) {
      showToast('Error triggering matching. Please try again.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[180px] p-8 bg-gradient-to-br from-gold-50/90 via-ivory-100/90 to-gold-50/90 rounded-3xl border border-gold-200/50 shadow-soft-xl flex items-center justify-center">
        <div className="text-text-primary text-lg">{t('common.loading')}</div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  if (!status.hasRequiredPalms) {
    return (
      <div className="group relative min-h-[180px] p-8 bg-gradient-to-br from-peach-50 via-peach-100 to-peach-50 hover:from-peach-100 hover:via-peach-200 hover:to-peach-100 rounded-3xl border-2 border-peach-300 hover:border-peach-500 transition-all duration-700 shadow-soft-xl hover:shadow-[0_20px_60px_rgba(255,157,122,0.4)] hover:-translate-y-2 hover:scale-[1.02] overflow-hidden flex items-center">
        <div className="absolute -inset-1 bg-gradient-to-r from-peach-400 to-peach-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-700"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="p-5 bg-gradient-to-br from-peach-500 to-peach-600 rounded-2xl shadow-soft-xl animate-pulse-soft group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-text-primary font-bold text-2xl mb-2">{t('dashboard.uploadYourPalms')}</p>
            <p className="text-text-secondary text-base">{t('dashboard.uploadBothPalms')}</p>
          </div>
        </div>
      </div>
    )
  }

  const isMatched = status.matchingResult
    ? (status.matchingResult.matching_confidence >= 0.50 || status.overallStatus === 'matched' || status.overallStatus === 'verified')
    : false

  return (
    <div className={`group relative overflow-hidden rounded-[2rem] border-2 transition-all duration-700 shadow-soft-xl hover:shadow-2xl hover:-translate-y-1.5 ${isMatched
        ? 'bg-gradient-to-br from-white via-green-50/30 to-green-100/20 border-green-200/60 hover:border-green-400'
        : 'bg-gradient-to-br from-white via-red-50/30 to-red-100/20 border-red-200/60 hover:border-red-400'
      } ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

      {/* Decorative background elements */}
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:opacity-40 ${isMatched ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
      <div className={`absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 rounded-full blur-2xl opacity-10 transition-all duration-700 group-hover:opacity-30 ${isMatched ? 'bg-green-300' : 'bg-red-300'
        }`}></div>

      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Status Icon & Score Ring */}
          <div className="relative flex-shrink-0">
            <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center bg-white shadow-soft-lg border-4 transition-all duration-700 group-hover:scale-105 ${isMatched ? 'border-green-100' : 'border-red-100'
              }`}>
              {/* Progress Ring (SVG) */}
              {status.matchingResult && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                  <circle
                    cx="56"
                    cy="56"
                    r="52"
                    className="fill-none stroke-beige-100 stroke-[6]"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={326.7}
                    strokeDashoffset={326.7 - (326.7 * (status.matchingResult.matching_confidence || 0))}
                    className={`transition-all duration-1000 delay-500 ${isMatched ? 'text-green-500' : 'text-red-500'
                      }`}
                  />
                </svg>
              )}

              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-700 shadow-inner ${isMatched
                  ? 'from-green-500 to-green-600 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]'
                  : 'from-red-500 to-red-600 group-hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                }`}>
                {isMatched ? (
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>

            {/* Score Badge */}
            {status.matchingResult && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-soft-lg border-2 border-beige-200">
                <span className={`text-xs font-bold font-sans ${isMatched ? 'text-green-600' : 'text-red-600'}`}>
                  {(status.matchingResult.matching_confidence * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 font-serif tracking-tight">
              {isMatched ? t('dashboard.palmsMatched') : t('dashboard.palmsNotMatched')}
            </h3>
            <p className="text-text-secondary text-base lg:text-lg mb-4 max-w-md">
              {isMatched
                ? 'Your palm patterns match perfectly with your profile. This ensures your readings are highly accurate.'
                : 'The uploaded palm images do not show a consistent pattern match. For accurate analysis, please re-upload clear photos.'
              }
            </p>

            {!isMatched && (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/onboarding/palm-upload"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-soft hover:shadow-soft-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('dashboard.reUpload')}
                </Link>
                <Link
                  href="/knowledge"
                  className="text-text-tertiary hover:text-text-primary text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  Why matching matters?
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}

            {isMatched && (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-green-600 font-bold text-sm tracking-wide bg-green-50/50 w-fit px-4 py-2 rounded-full border border-green-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                VERIFIED PROFILE
              </div>
            )}
          </div>

          {/* Right Decoration for Matched state */}
          {isMatched && (
            <div className="hidden lg:block relative w-32 h-32 flex-shrink-0">
              <div className="absolute inset-0 bg-gold-400/10 rounded-full animate-pulse-soft"></div>
              <svg className="absolute inset-4 text-gold-500/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
}
