'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CountryInput from '@/app/components/CountryInput'
import DatePicker from '@/app/components/DatePicker'
import TimePicker from '@/app/components/TimePicker'
import PlaceInput from '@/app/components/PlaceInput'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import { useI18n } from '@/app/hooks/useI18n'

interface OnboardingData {
  name: string
  country: string
  preferred_language: string
  timezone: string
  date_of_birth: string
  time_of_birth: string
  place_of_birth: string
  birth_timezone: string
  consent_images: boolean
  consent_data_usage: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    country: '',
    preferred_language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    date_of_birth: '',
    time_of_birth: '',
    place_of_birth: '',
    birth_timezone: '',
    consent_images: false,
    consent_data_usage: false,
  })

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = async () => {
    if (currentStep === 3) {
      await handleSubmit()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          consent_flags: {
            images: formData.consent_images,
            data_usage: formData.consent_data_usage,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(result.error?.message || t('onboarding.failedToSave'))
      }

      router.push('/onboarding/palm-upload')
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '' && formData.country.trim() !== ''
      case 2:
        return (
          formData.date_of_birth !== '' &&
          formData.time_of_birth !== '' &&
          formData.place_of_birth.trim() !== ''
        )
      case 3:
        return formData.consent_images && formData.consent_data_usage
      default:
        return false
    }
  }

  const steps = [
    { number: 1, title: t('onboarding.basicInfo'), icon: '👤' },
    { number: 2, title: t('onboarding.birthDetails'), icon: '🌟' },
    { number: 3, title: t('onboarding.consent'), icon: '✓' },
  ]

  return (
    <main className="min-h-screen bg-gradient-soft p-4 flex items-center justify-center py-12 relative">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="max-w-2xl mx-auto w-full animate-scale-in">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            <span className="text-text-primary font-semibold">{t('onboarding.step')} {currentStep} {t('onboarding.of')} 3</span>
            <span className="text-text-secondary">
              {Math.round((currentStep / 3) * 100)}%
            </span>
          </div>
          <div className="w-full bg-beige-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-gold-500 to-gold-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-10 shadow-soft-xl border border-beige-300/50">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-peach-400 to-peach-500 rounded-2xl mb-4 shadow-soft">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-text-primary mb-2 font-serif">{t('onboarding.welcome')}</h2>
                <p className="text-text-secondary">
                  {t('onboarding.welcomeDesc')}
                </p>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2 text-sm">
                  {t('auth.fullName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-beige-300 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all"
                  placeholder={t('onboarding.enterFullName')}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2 text-sm">
                  {t('auth.country')} *
                </label>
                <CountryInput
                  value={formData.country}
                  onChange={(value) => updateFormData('country', value)}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2 text-sm">
                  {t('onboarding.preferredLanguage')}
                </label>
                <select
                  value={formData.preferred_language}
                  onChange={(e) => updateFormData('preferred_language', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-beige-300 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Birth Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl mb-4 shadow-soft">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-text-primary mb-2 font-serif">{t('onboarding.birthDetails')}</h2>
                <p className="text-text-secondary">
                  {t('onboarding.birthDetailsDesc')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-primary font-medium mb-2 text-sm">
                    {t('onboarding.dateOfBirth')} *
                  </label>
                  <DatePicker
                    value={formData.date_of_birth}
                    onChange={(date) => updateFormData('date_of_birth', date)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-text-primary font-medium mb-2 text-sm">
                    {t('onboarding.timeOfBirth')} *
                  </label>
                  <TimePicker
                    value={formData.time_of_birth}
                    onChange={(time) => updateFormData('time_of_birth', time)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2 text-sm">
                  {t('onboarding.placeOfBirth')} *
                </label>
                <PlaceInput
                  value={formData.place_of_birth}
                  onChange={(value) => updateFormData('place_of_birth', value)}
                  onTimezoneDetected={(timezone) => updateFormData('birth_timezone', timezone)}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2 text-sm">
                  {t('onboarding.birthTimezone')}
                </label>
                <input
                  type="text"
                  value={formData.birth_timezone || formData.timezone}
                  onChange={(e) => updateFormData('birth_timezone', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-beige-300 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all"
                  placeholder={t('onboarding.timezoneAutoDetected')}
                />
                <p className="text-text-tertiary text-xs mt-1">
                  {t('onboarding.timezoneAutoDetectedDesc')}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Consent */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sage-400 to-sage-500 rounded-2xl mb-4 shadow-soft">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-text-primary mb-2 font-serif">{t('onboarding.consent')}</h2>
                <p className="text-text-secondary">
                  {t('onboarding.consentDesc')}
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl hover:bg-beige-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.consent_images}
                    onChange={(e) => updateFormData('consent_images', e.target.checked)}
                    className="mt-1 w-5 h-5 text-gold-600 rounded focus:ring-gold-400"
                  />
                  <div>
                    <span className="text-text-primary font-semibold block">
                      {t('onboarding.imageStorageConsent')} *
                    </span>
                    <span className="text-text-secondary text-sm">
                      {t('onboarding.imageStorageConsentDesc')}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl hover:bg-beige-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.consent_data_usage}
                    onChange={(e) => updateFormData('consent_data_usage', e.target.checked)}
                    className="mt-1 w-5 h-5 text-gold-600 rounded focus:ring-gold-400"
                  />
                  <div>
                    <span className="text-text-primary font-semibold block">
                      {t('onboarding.dataUsageConsent')} *
                    </span>
                    <span className="text-text-secondary text-sm">
                      {t('onboarding.dataUsageConsentDesc')}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-beige-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-white border-2 border-beige-300 hover:border-gold-400 text-text-primary rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t('onboarding.back')}
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out shadow-soft hover:shadow-soft-lg hover:shadow-gold-500/30 transform hover:scale-[1.03] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('onboarding.saving')}
                </span>
              ) : currentStep === 3 ? (
                t('onboarding.completeSetup')
              ) : (
                t('onboarding.next')
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
