'use client'

import { useCallback, useState, useEffect } from 'react'
import { useTranslation } from '@/app/contexts/TranslationContext'
import { getTranslation, TranslationKey, dictionaries } from '@/lib/i18n/index'

/**
 * Hook for i18n translations using static dictionaries
 * NO API calls - instant translations from dictionaries
 * Automatically re-renders when language changes
 */
export function useI18n() {
  const { language } = useTranslation()
  const [renderKey, setRenderKey] = useState(0)

  // Force re-render when language changes
  useEffect(() => {
    setRenderKey(prev => prev + 1)
  }, [language])

  /**
   * Get translation for a key
   * Falls back to English if key or language is missing
   * NEVER throws or fetches from network
   * 
   * Note: We don't use useCallback here to ensure the function reference changes
   * when language changes, forcing components to re-render
   */
  const t = (key: TranslationKey | string): string => {
    // Get dictionary for current language, fallback to English
    const dict = dictionaries[language] ?? dictionaries.en
    
    // Get translation, fallback to English, then to key itself
    if (typeof key === 'string' && key.includes('.')) {
      return dict[key] ?? dictionaries.en[key] ?? key
    }
    
    // If key is not a translation key, return as-is
    return key
  }

  return { t, language, renderKey }
}
