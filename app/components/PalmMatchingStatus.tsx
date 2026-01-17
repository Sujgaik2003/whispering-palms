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
    <div className={`group relative min-h-[180px] p-8 rounded-3xl border-2 transition-all duration-700 shadow-soft-xl hover:shadow-[0_25px_70px_rgba(34,197,94,0.3)] hover:-translate-y-2 hover:scale-[1.02] overflow-hidden flex items-center ${
      isMatched 
        ? 'bg-gradient-to-br from-green-50 via-green-100 to-green-50 border-green-400 hover:border-green-500' 
        : 'bg-gradient-to-br from-red-50 via-red-100 to-red-50 border-red-400 hover:border-red-500'
    } ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Glow effect on hover */}
      <div className={`absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-700 ${
        isMatched ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'
      }`}></div>
      
      {/* Shimmer overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1">
          {isMatched ? (
            <div className="p-5 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-soft-xl animate-pulse-soft group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 group-hover:shadow-[0_15px_50px_rgba(34,197,94,0.5)]">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ) : (
            <div className="p-5 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-soft-xl animate-pulse-soft group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 group-hover:shadow-[0_15px_50px_rgba(239,68,68,0.5)]">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <p className="text-text-primary font-bold text-3xl mb-3">
              {isMatched ? t('dashboard.palmsMatched') : t('dashboard.palmsNotMatched')}
            </p>
            {status.matchingResult && (
              <div className="flex items-center gap-4">
                <span className={`px-5 py-2 rounded-full font-bold text-base ${
                  isMatched
                    ? 'bg-green-200 text-green-800 border-2 border-green-400'
                    : 'bg-red-200 text-red-800 border-2 border-red-400'
                }`}>
                  {t('dashboard.matchingScore')}: {(status.matchingResult.matching_confidence * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {!isMatched && (
              <p className="text-yellow-700 text-base mt-3 font-medium">{t('common.pleaseReUpload')}</p>
            )}
          </div>
        </div>
        {!isMatched && (
          <Link
            href="/onboarding/palm-upload"
            className="px-8 py-4 bg-gradient-to-r from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 text-white rounded-xl font-bold text-base transition-all shadow-soft-xl hover:shadow-[0_15px_40px_rgba(255,157,122,0.5)] hover:scale-110 flex items-center gap-3 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {t('dashboard.reUpload')}
          </Link>
        )}
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
