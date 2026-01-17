'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/app/components/Toast'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import CheckoutModal from '@/app/components/CheckoutModal'
import { useI18n } from '@/app/hooks/useI18n'

interface Plan {
  id: 'basic' | 'spark' | 'flame' | 'superflame'
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  features: string[]
  questionsPerDay: number | string
  deliveryTime: string
  color: 'basic' | 'spark' | 'flame' | 'superflame'
  popular?: boolean
  icon: JSX.Element
}

// Plans array - will be created as a function to use translations
const getPlans = (t: (key: string) => string): Plan[] => [
  {
    id: 'basic',
    name: t('plan.basic'),
    description: t('plan.basicDesc'),
    priceMonthly: 0,
    priceYearly: 0,
    questionsPerDay: 2,
    deliveryTime: '24 hours',
    color: 'basic',
    features: [
      `2 ${t('plan.questionsPerDay')}`,
      t('plan.writtenAnswers'),
      `${t('plan.emailDelivery')} 24 hours`,
      t('plan.basicInsights'),
      t('plan.questionHistory'),
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    id: 'spark',
    name: t('plan.spark'),
    description: t('plan.sparkDesc'),
    priceMonthly: 10,
    priceYearly: 80,
    questionsPerDay: 5,
    deliveryTime: '1 hour',
    color: 'spark',
    popular: true,
    features: [
      `5 ${t('plan.questionsPerDay')}`,
      t('plan.writtenAnswers'),
      `${t('plan.emailDelivery')} 1 hour`,
      t('plan.enhancedInsights'),
      t('plan.prioritySupport'),
      t('plan.questionHistory'),
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'flame',
    name: t('plan.flame'),
    description: t('plan.flameDesc'),
    priceMonthly: 25,
    priceYearly: 200,
    questionsPerDay: 8,
    deliveryTime: '5 minutes',
    color: 'flame',
    features: [
      `8 ${t('plan.questionsPerDay')}`,
      t('plan.voiceNarrationWithAstrologer'),
      `${t('plan.emailDelivery')} 5 minutes`,
      t('plan.professionalFormatting'),
      t('plan.premiumInsights'),
      t('plan.prioritySupport'),
      t('plan.questionHistory'),
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
  },
  {
    id: 'superflame',
    name: t('plan.superflame'),
    description: t('plan.superflameDesc'),
    priceMonthly: 35,
    priceYearly: 280,
    questionsPerDay: t('common.unlimited'),
    deliveryTime: '5 minutes',
    color: 'superflame',
    features: [
      t('plan.unlimitedQuestions'),
      t('plan.voiceNarrationWithAstrologer'),
      `${t('plan.emailDelivery')} 5 minutes`,
      t('plan.professionalFormatting'),
      t('plan.premiumInsights'),
      t('plan.prioritySupport'),
      t('plan.questionHistory'),
      t('plan.allFlameFeatures'),
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
]

const colorClasses = {
  basic: {
    bg: 'from-beige-50 via-beige-100 to-beige-50',
    hover: 'hover:from-beige-100 hover:via-beige-200 hover:to-beige-100',
    border: 'border-beige-300 hover:border-beige-500',
    icon: 'text-beige-600',
    button: 'from-beige-500 to-beige-600 hover:from-beige-600 hover:to-beige-700',
    glow: 'from-beige-400 to-beige-600',
    shadow: 'shadow-[0_20px_60px_rgba(200,180,160,0.4)]',
  },
  spark: {
    bg: 'from-peach-50 via-peach-100 to-peach-50',
    hover: 'hover:from-peach-100 hover:via-peach-200 hover:to-peach-100',
    border: 'border-peach-300 hover:border-peach-500',
    icon: 'text-peach-600',
    button: 'from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700',
    glow: 'from-peach-400 to-peach-600',
    shadow: 'shadow-[0_20px_60px_rgba(255,157,122,0.4)]',
  },
  flame: {
    bg: 'from-gold-50 via-gold-100 to-gold-50',
    hover: 'hover:from-gold-100 hover:via-gold-200 hover:to-gold-100',
    border: 'border-gold-300 hover:border-gold-500',
    icon: 'text-gold-600',
    button: 'from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700',
    glow: 'from-gold-400 to-gold-600',
    shadow: 'shadow-[0_20px_60px_rgba(230,194,89,0.4)]',
  },
  superflame: {
    bg: 'from-purple-50 via-purple-100 to-purple-50',
    hover: 'hover:from-purple-100 hover:via-purple-200 hover:to-purple-100',
    border: 'border-purple-300 hover:border-purple-500',
    icon: 'text-purple-600',
    button: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    glow: 'from-purple-400 to-purple-600',
    shadow: 'shadow-[0_20px_60px_rgba(147,51,234,0.4)]',
  },
}

export default function SubscriptionPage() {
  const router = useRouter()
  const { t, language, renderKey } = useI18n() // i18n hook for translations - renderKey forces re-render
  const [mounted, setMounted] = useState(false)
  const [forceRender, setForceRender] = useState(0) // Force re-render counter
  
  // Get plans with translations
  const plans = getPlans(t)
  
  // Force re-render when language changes
  useEffect(() => {
    console.log(`[Subscription] 🔄 Language or renderKey changed - language: ${language}, renderKey: ${renderKey}`)
    // This ensures component re-renders when translations are ready
    setForceRender(prev => {
      const newCount = prev + 1
      console.log(`[Subscription] ✅ Updated forceRender to: ${newCount}`)
      return newCount
    })
  }, [language, renderKey])
  
  // Listen for translation ready events
  useEffect(() => {
    const handleTranslationReady = (event?: any) => {
      console.log(`[Subscription] 🔔 i18n:translationReady event received`, event?.detail)
      // Force re-render when translations are ready
      setForceRender(prev => {
        const newCount = prev + 1
        console.log(`[Subscription] ✅ handleTranslationReady updated forceRender to: ${newCount}`)
        return newCount
      })
    }
    
    const handleForceUpdate = () => {
      console.log(`[Subscription] 🔔 i18n:forceUpdate event received`)
      setForceRender(prev => {
        const newCount = prev + 1
        console.log(`[Subscription] ✅ handleForceUpdate updated forceRender to: ${newCount}`)
        return newCount
      })
    }
    
    const handleLanguageChanged = (event?: any) => {
      console.log(`[Subscription] 🔔 i18n:languageChanged event received`, event?.detail)
      setForceRender(prev => {
        const newCount = prev + 1
        console.log(`[Subscription] ✅ handleLanguageChanged updated forceRender to: ${newCount}`)
        return newCount
      })
    }
    
    if (typeof window !== 'undefined') {
      console.log(`[Subscription] 👂 Registering event listeners`)
      window.addEventListener('i18n:translationReady', handleTranslationReady)
      window.addEventListener('i18n:forceUpdate', handleForceUpdate)
      window.addEventListener('i18n:languageChanged', handleLanguageChanged)
      
      return () => {
        console.log(`[Subscription] 🧹 Cleaning up event listeners`)
        window.removeEventListener('i18n:translationReady', handleTranslationReady)
        window.removeEventListener('i18n:forceUpdate', handleForceUpdate)
        window.removeEventListener('i18n:languageChanged', handleLanguageChanged)
      }
    }
  }, [])
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<'basic' | 'spark' | 'flame' | 'superflame' | null>(null)
  const [loading, setLoading] = useState(false)
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; amount: number } | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  })

  useEffect(() => {
    setMounted(true)
    fetchCurrentPlan()
  }, [])

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch('/api/quota')
      const result = await response.json()
      if (response.ok && result.data?.plan) {
        setCurrentPlan(result.data.plan)
      }
    } catch (error) {
      console.error('Failed to fetch current plan:', error)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true })
  }

  const handleSubscribe = async (planId: 'basic' | 'spark' | 'flame' | 'superflame') => {
    // Don't update if already on this plan
    if (currentPlan === planId) {
      showToast(`${t('plan.alreadyOnPlan')} ${planId} ${t('plan.plan')}`, 'info')
      return
    }

    const plan = plans.find(p => p.id === planId)
    if (!plan) return

    // If it's the free basic plan, update directly
    if (planId === 'basic' || plan.priceMonthly === 0) {
      await updatePlanDirectly(planId)
      return
    }

    // For paid plans, open checkout modal
    const amount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly
    setSelectedPlan({ id: planId, amount })
    setCheckoutOpen(true)
  }

  const updatePlanDirectly = async (planId: 'basic' | 'spark' | 'flame' | 'superflame') => {
    setUpdatingPlan(planId)
    setLoading(true)

    try {
      const response = await fetch('/api/subscription/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType: planId }),
      })

      const result = await response.json()

      if (response.ok) {
        setCurrentPlan(planId)
        showToast(`Successfully changed to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan!`, 'success')
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('planChanged', { detail: { planType: planId } }))
        // Refresh quota to show updated limits
        setTimeout(() => {
          // Navigate to chat page to see updated quota
          router.push('/chat')
        }, 1500)
      } else {
        showToast(result.error?.message || 'Failed to update plan. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error updating plan:', error)
      showToast('An error occurred. Please try again.', 'error')
    } finally {
      setLoading(false)
      setUpdatingPlan(null)
    }
  }

  const handleCheckoutSuccess = async () => {
    if (!selectedPlan) return

    // After successful payment, update the plan
    await updatePlanDirectly(selectedPlan.id as 'basic' | 'spark' | 'flame' | 'superflame')
    setCheckoutOpen(false)
    setSelectedPlan(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gold-50 via-ivory-100 to-gold-50 p-4 md:p-6 relative">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="max-w-7xl mx-auto py-6">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('subscription.backToDashboard')}
          </Link>
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary font-serif mb-4">
            {t('subscription.title')}
          </h1>
          {currentPlan && (
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-100 to-gold-200 rounded-full border-2 border-gold-400">
              <svg className="w-5 h-5 text-gold-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gold-800 font-semibold">
                {t('subscription.currentPlan')}: <span className="capitalize">{currentPlan}</span>
              </span>
            </div>
          )}
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            {t('subscription.description')}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-full p-2 border-2 border-beige-300 shadow-soft">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-soft'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('subscription.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full font-semibold transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-soft'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('subscription.yearly')}
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {t('subscription.savePercent')} 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plans.map((plan, index) => {
            const colors = colorClasses[plan.color]
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly
            const isHovered = hoveredPlan === plan.id

            return (
              <div
                key={plan.id}
                className={`group relative bg-gradient-to-br ${colors.bg} ${colors.hover} rounded-3xl p-8 border-2 ${colors.border} transition-all duration-700 shadow-soft-xl hover:shadow-2xl hover:-translate-y-4 hover:scale-[1.05] overflow-hidden ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } ${plan.popular ? 'ring-4 ring-gold-400 ring-opacity-50 scale-105 z-10' : ''}`}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-1 rounded-bl-2xl rounded-tr-3xl text-sm font-bold shadow-soft z-20">
                    {t('subscription.mostPopular')}
                  </div>
                )}

                {/* Glow effect on hover */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${colors.glow} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-700`}></div>

                {/* Shimmer overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`mb-6 p-4 bg-white/80 rounded-2xl inline-flex ${colors.icon} group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-soft`}>
                    {plan.icon}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-3xl font-bold text-text-primary mb-2 font-serif">{plan.name}</h3>
                  <p className="text-text-secondary text-sm mb-6 min-h-[40px]">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-text-primary">
                        ${price}
                      </span>
                      <span className="text-text-secondary">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && plan.priceYearly > 0 && (
                      <p className="text-sm text-text-tertiary mt-1">
                        ${plan.priceMonthly} {t('subscription.perMonth')} {t('subscription.billedAnnually')}
                      </p>
                    )}
                  </div>

                  {/* Questions per day */}
                  <div className="mb-6 p-4 bg-white/60 rounded-xl border border-beige-200">
                    <div className="text-sm text-text-secondary mb-1">{t('subscription.questionsPerDay')}</div>
                    <div className="text-2xl font-bold text-text-primary">
                      {plan.questionsPerDay}
                    </div>
                  </div>

                  {/* Delivery time */}
                  <div className="mb-6 p-4 bg-white/60 rounded-xl border border-beige-200">
                    <div className="text-sm text-text-secondary mb-1">{t('subscription.deliveryTime')}</div>
                    <div className="text-lg font-semibold text-text-primary">
                      {plan.deliveryTime}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg
                          className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-text-secondary text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Current Plan Badge */}
                  {currentPlan === plan.id && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl text-center font-semibold shadow-soft">
                      ✓ {t('subscription.currentPlan')}
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading || currentPlan === plan.id}
                    className={`w-full py-4 bg-gradient-to-r ${colors.button} text-white rounded-xl font-bold text-lg transition-all shadow-soft hover:shadow-soft-lg transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      currentPlan === plan.id ? 'opacity-60' : ''
                    }`}
                  >
                    {loading && updatingPlan === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('subscription.updating')}
                      </span>
                    ) : currentPlan === plan.id ? (
                      t('subscription.currentPlan')
                    ) : plan.priceMonthly === 0 ? (
                      t('subscription.getStartedFree')
                    ) : (
                      `${t('subscription.switchTo')} ${plan.name}`
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Note */}
        <div className={`text-center text-text-tertiary text-sm transition-all duration-700 delay-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p>{t('subscription.footerNote1')}</p>
          <p className="mt-2">{t('subscription.footerNote2')}</p>
          <p className="mt-2 text-gold-600 font-semibold">{t('subscription.footerNote3')}</p>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false)
            setSelectedPlan(null)
          }}
          planType={selectedPlan.id as 'basic' | 'spark' | 'flame' | 'superflame'}
          billingPeriod={billingCycle}
          amount={selectedPlan.amount}
          currency="USD"
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </main>
  )
}
