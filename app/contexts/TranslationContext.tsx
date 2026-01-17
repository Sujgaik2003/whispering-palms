'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { isRTL, isLanguageSupported } from '@/lib/i18n/index'

interface TranslationContextType {
  language: string
  setLanguage: (lang: string) => void
  isRTL: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>('en')
  const [isInitialized, setIsInitialized] = useState(false)

  // Load saved language from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedLang = localStorage.getItem('preferred_language') || 'en'
    
    // Validate language is supported
    const validLang = isLanguageSupported(savedLang) ? savedLang : 'en'
    
    setLanguageState(validLang)
    
    // Set document language and direction
    if (typeof document !== 'undefined') {
      document.documentElement.lang = validLang
      document.documentElement.dir = isRTL(validLang) ? 'rtl' : 'ltr'
    }
    
    setIsInitialized(true)
  }, [])

  // Update document direction when language changes
  useEffect(() => {
    if (typeof document !== 'undefined' && isInitialized) {
      document.documentElement.lang = language
      document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr'
    }
  }, [language, isInitialized])

  const setLanguage = useCallback((lang: string) => {
    // Early return if language hasn't actually changed
    if (lang === language) {
      return
    }

    // Validate language is supported, fallback to English
    const validLang = isLanguageSupported(lang) ? lang : 'en'
    
    console.log(`[TranslationContext] 🌐 Changing language to: ${validLang}`)
    
    // Update state
    setLanguageState(validLang)
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_language', validLang)
    }
    
    // Update document language and direction immediately
    if (typeof document !== 'undefined') {
      document.documentElement.lang = validLang
      document.documentElement.dir = isRTL(validLang) ? 'rtl' : 'ltr'
    }

    // Update user preference in database (non-blocking)
    if (typeof window !== 'undefined') {
      fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_language: validLang }),
      }).catch(error => {
        console.warn('Could not update language preference:', error)
      })
    }
  }, [language])

  const isRTLMode = isRTL(language)

  return (
    <TranslationContext.Provider value={{ language, setLanguage, isRTL: isRTLMode }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return context
}
