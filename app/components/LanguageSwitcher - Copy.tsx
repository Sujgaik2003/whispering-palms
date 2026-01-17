'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from '@/app/contexts/TranslationContext'

interface Language {
  code: string
  name: string
  nativeName: string
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === language) {
      console.log(`[LanguageSwitcher] ⚠️ Language already set to: ${langCode}`)
      setIsOpen(false)
      return
    }

    console.log(`[LanguageSwitcher] 🔄 Changing language from ${language} to ${langCode}`)
    setIsOpen(false)
    setIsTranslating(true)
    
    // Set language - this will trigger translation events immediately
    console.log(`[LanguageSwitcher] 📞 Calling setLanguage(${langCode})`)
    await setLanguage(langCode)
    console.log(`[LanguageSwitcher] ✅ setLanguage(${langCode}) completed`)
    
    // Trigger MULTIPLE events to ensure all components catch it
    if (typeof window !== 'undefined') {
      console.log(`[LanguageSwitcher] 📡 Dispatching additional language change events`)
      window.dispatchEvent(new CustomEvent('translatePage', { detail: { lang: langCode } }))
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: langCode } }))
      window.dispatchEvent(new CustomEvent('i18n:languageChanged', { detail: { lang: langCode } }))
      window.dispatchEvent(new Event('i18n:forceUpdate'))
      console.log(`[LanguageSwitcher] 📡 Dispatched immediate events`)
      
      // Additional triggers with slight delay to ensure all components update
      setTimeout(() => {
        console.log(`[LanguageSwitcher] 📡 Dispatching delayed events (50ms)`)
        window.dispatchEvent(new Event('i18n:forceUpdate'))
        window.dispatchEvent(new CustomEvent('i18n:languageChanged', { detail: { lang: langCode } }))
      }, 50)
      
      setTimeout(() => {
        console.log(`[LanguageSwitcher] 📡 Dispatching delayed events (200ms)`)
        window.dispatchEvent(new Event('i18n:forceUpdate'))
      }, 200)
    }
    
    // Stop translating indicator after translations have time to process
    setTimeout(() => {
      console.log(`[LanguageSwitcher] ✅ Stopping translation indicator`)
      setIsTranslating(false)
    }, 1000)
  }

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === language) || SUPPORTED_LANGUAGES[0]

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setButtonRect(rect)
    }
  }, [isOpen])

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => {
            if (buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect()
              setButtonRect(rect)
            }
            setIsOpen(!isOpen)
          }}
          disabled={isTranslating}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border-2 border-gold-400/50 text-text-primary rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-white hover:border-gold-500 hover:shadow-soft disabled:opacity-50 disabled:cursor-wait"
          aria-label="Select language"
          data-no-translate
        >
          {isTranslating ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Translating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{currentLanguage.nativeName}</span>
              <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      </div>
      {mounted && isOpen && buttonRect && createPortal(
        <>
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
            style={{ zIndex: 2147483646 }}
          />
          <div 
            className="fixed bg-white rounded-xl shadow-2xl border-2 border-gold-200/50 overflow-hidden min-w-[220px] max-w-[280px] max-h-[400px] overflow-y-auto"
            style={{ 
              zIndex: 2147483647,
              top: `${buttonRect.bottom + 8}px`,
              right: `${window.innerWidth - buttonRect.right}px`,
              position: 'fixed'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-3 py-2 text-left hover:bg-gold-50 transition-colors flex items-center justify-between ${
                  language === lang.code ? 'bg-gold-100 font-semibold' : ''
                }`}
              >
                <div>
                  <div className="text-text-primary text-xs font-medium">{lang.nativeName}</div>
                  <div className="text-text-tertiary text-[10px]">{lang.name}</div>
                </div>
                {language === lang.code && (
                  <svg className="w-4 h-4 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  )
}
