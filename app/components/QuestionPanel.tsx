'use client'

import { useState, useEffect } from 'react'
import Toast from './Toast'
import { useI18n } from '@/app/hooks/useI18n'

interface Quota {
  used: number
  remaining: number
  max: number
  resetAt: string
  percentage: number
}

interface Question {
  id: string
  text_original: string
  category: string
  status: string
  created_at: string
  email_sent_at?: string
}

export default function QuestionPanel() {
  const { t, renderKey } = useI18n() // i18n hook for translations
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [quota, setQuota] = useState<Quota | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  })

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true })
  }

  useEffect(() => {
    loadQuota()
    loadQuestions()
  }, [])

  // Refresh quota when page becomes visible or when plan changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadQuota()
      }
    }

    const handleFocus = () => {
      loadQuota()
    }

    const handlePlanChanged = () => {
      // Refresh quota when plan changes
      loadQuota()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('planChanged', handlePlanChanged)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('planChanged', handlePlanChanged)
    }
  }, [])

  const loadQuota = async () => {
    try {
      const response = await fetch('/api/quota', {
        cache: 'no-store', // Always fetch fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const result = await response.json()

      if (response.ok && result.data?.quota) {
        console.log('📊 Quota loaded:', result.data.quota)
        setQuota(result.data.quota)
      } else {
        console.error('Failed to load quota:', result)
      }
    } catch (error) {
      console.error('Error loading quota:', error)
    }
  }

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/questions?limit=50')
      const result = await response.json()

      if (response.ok && result.data?.questions) {
        setQuestions(result.data.questions)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || submitting) return

    // Check quota before submission (skip for unlimited plans)
    if (quota && quota.max !== -1 && quota.remaining <= 0) {
      showToast('Daily quota exhausted. Please try again tomorrow.', 'warning')
      return
    }

    const questionText = input.trim()
    setInput('')
    setSubmitting(true)

    try {
      // Submit question
      const questionResponse = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: questionText,
          category: 'general',
        }),
      })

      const questionResult = await questionResponse.json()

      if (!questionResponse.ok) {
        if (questionResponse.status === 429) {
          showToast(questionResult.error?.message || 'Daily quota exhausted', 'warning')
          await loadQuota()
          return
        }
        throw new Error(questionResult.error?.message || 'Failed to submit question')
      }

      const questionId = questionResult.data.question.id

      // Generate answer
      const answerResponse = await fetch('/api/questions/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionId,
        }),
      })

      const answerResult = await answerResponse.json()

      if (!answerResponse.ok) {
        if (answerResponse.status === 503) {
          showToast(
            'Service is temporarily unavailable. Your question has been saved and will be answered via email.',
            'warning'
          )
        } else {
          showToast(answerResult.error?.message || 'Failed to generate answer', 'error')
        }
        await loadQuestions()
        await loadQuota()
        return
      }

      // Update quota
      if (answerResult.data.quota) {
        setQuota({
          ...quota!,
          remaining: answerResult.data.quota.remaining,
          used: answerResult.data.quota.used,
          max: answerResult.data.quota.max,
          percentage: Math.round((answerResult.data.quota.used / answerResult.data.quota.max) * 100),
        })
      }

      showToast('Your question has been submitted. You will receive the answer via email.', 'success')
      await loadQuestions()
    } catch (error) {
      console.error('Error submitting question:', error)
      showToast(
        error instanceof Error ? error.message : 'An error occurred',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-soft">
      {/* Quota Display */}
      {quota && (
        <div className="bg-white/60 backdrop-blur-lg border-b border-beige-300/50 p-4">
          <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-text-secondary">
                    {t('common.dailyQuota')}: {quota.max === -1 ? t('common.unlimited') : `${quota.used} / ${quota.max}`}
                  </span>
                  <button
                    onClick={loadQuota}
                    className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-beige-100 rounded-lg transition-all"
                    title="Refresh quota"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <span
                  className={`font-semibold ${
                    quota.max === -1
                      ? 'text-purple-600'
                      : quota.remaining === 0
                      ? 'text-red-500'
                      : quota.remaining <= 1
                      ? 'text-yellow-500'
                      : 'text-green-600'
                  }`}
                >
                  {quota.max === -1 ? t('common.unlimited') : `${quota.remaining} ${t('common.remaining')}`}
                </span>
              </div>
            {quota.max !== -1 && (
              <>
                <div className="w-full bg-beige-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      quota.percentage >= 100
                        ? 'bg-red-500'
                        : quota.percentage >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                  />
                </div>
                {quota.remaining === 0 && (
                  <p className="text-red-600 text-xs mt-2">
                    Daily quota exhausted. Quota will reset at {new Date(quota.resetAt).toLocaleTimeString()}
                  </p>
                )}
              </>
            )}
            {quota.max === -1 && (
              <p className="text-purple-600 text-xs mt-2 font-semibold">
                ✨ Unlimited questions with SuperFlame plan
              </p>
            )}
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 border border-beige-300/50 shadow-soft-xl">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full shadow-soft">
                    <svg
                      className="w-16 h-16 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2 font-serif">{t('chat.noQuestions')}</h3>
                <p className="text-text-secondary">
                  Ask your first question below and receive a personalized answer via email.
                </p>
              </div>
            </div>
          ) : (
            questions.map((question) => (
              <div
                key={question.id}
                className="bg-white/80 backdrop-blur-sm border border-beige-300/50 rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all"
              >
                <div className="mb-3">
                  <p className="text-text-secondary">{question.text_original}</p>
                </div>
                
                {/* Status Display */}
                <div className="mt-4 pt-4 border-t border-beige-200">
                  {question.status === 'pending' ? (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold">{t('chat.pending')}</span>
                      <span className="text-xs text-text-tertiary ml-2">{t('chat.checkEmail')}</span>
                    </div>
                  ) : question.status === 'sent' && question.email_sent_at ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold">{t('chat.sent')}</span>
                      </div>
                      <p className="text-text-secondary text-sm mt-1">
                        ✅ {t('chat.checkEmail')}
                      </p>
                      <p className="text-text-tertiary text-xs">
                        Delivered on {new Date(question.email_sent_at).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-text-tertiary">
                      <span className="text-sm">Status: {question.status}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-text-tertiary text-xs mt-3">
                  Asked on {new Date(question.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Container */}
      <div className="border-t border-beige-300/50 bg-white/60 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="w-full bg-white border border-beige-300 rounded-xl px-5 py-4 text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all text-base shadow-soft resize-none"
                disabled={submitting || (quota && quota.max !== -1 && quota.remaining === 0)}
                maxLength={1000}
                rows={3}
              />
              <div className="absolute bottom-2 right-3 text-xs text-text-tertiary">
                {input.length}/1000
              </div>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || submitting || (quota?.remaining === 0)}
              className="px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-soft hover:shadow-soft-lg transform hover:scale-[1.02] flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  <span>{t('chat.submit')}</span>
                </>
              )}
            </button>
          </form>
          <p className="text-text-tertiary text-xs mt-2 text-center">
            Your answer will be delivered via email based on your subscription plan.
          </p>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  )
}
