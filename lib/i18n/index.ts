/**
 * i18n Dictionary Index
 * Centralized dictionary loading and management
 * 
 * To add a new language:
 * 1. Create a new file: lib/i18n/{lang}.ts
 * 2. Copy the structure from en.ts
 * 3. Translate all values
 * 4. Import and add to dictionaries object below
 * 
 * NO code changes needed - just add the dictionary file!
 */

import en from './en'
import hi from './hi'
import es from './es'
import fr from './fr'
import de from './de'

// RTL languages (add language codes here when adding RTL support)
const RTL_LANGUAGES: string[] = [] // Currently none, but can add: 'ar', 'he', 'ur', 'fa'

export type TranslationKey = keyof typeof en

export interface Dictionary {
  [key: string]: string
}

// All language dictionaries
// To add a new language: import it above and add it here
export const dictionaries: Record<string, Dictionary> = {
  en,
  hi,
  es,
  fr,
  de,
}

/**
 * Get translation for a key in the specified language
 * Falls back to English if key or language is missing
 * NEVER throws or fetches from network
 */
export function getTranslation(key: TranslationKey, lang: string = 'en'): string {
  // Always fallback to English if language not found
  const dict = dictionaries[lang] ?? dictionaries.en
  // Fallback to English if key not found in target language
  return dict[key] ?? dictionaries.en[key] ?? key
}

/**
 * Check if language is RTL
 */
export function isRTL(lang: string): boolean {
  return RTL_LANGUAGES.includes(lang)
}

/**
 * Get all supported language codes
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(dictionaries)
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(lang: string): boolean {
  return lang in dictionaries
}
