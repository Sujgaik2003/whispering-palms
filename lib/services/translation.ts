/**
 * Translation Service
 * Handles language detection and translation for multilingual support
 */

interface TranslationConfig {
  provider: 'llm' | 'libretranslate' | 'mymemory'
  apiUrl?: string
  apiKey?: string
}

interface LanguageDetectionResult {
  language: string
  confidence: number
}

class TranslationService {
  private config: TranslationConfig

  constructor() {
    // Default to LLM-based translation (no additional service needed)
    this.config = {
      provider: (process.env.TRANSLATION_PROVIDER as any) || 'llm',
      apiUrl: process.env.LIBRETRANSLATE_API_URL || 'http://localhost:5000',
      apiKey: process.env.TRANSLATION_API_KEY,
    }
  }

  /**
   * Detect language of text
   * Uses simple heuristics for common languages (can be enhanced with proper library)
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    if (!text || text.trim().length === 0) {
      return { language: 'en', confidence: 0 }
    }

    // Simple language detection using character patterns
    // For production, use a proper library like 'langdetect' or 'franc'
    const textLower = text.toLowerCase().trim()

    // Hindi detection (Devanagari script)
    if (/[\u0900-\u097F]/.test(text)) {
      return { language: 'hi', confidence: 0.9 }
    }

    // Common English patterns
    const englishPatterns = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/i
    if (englishPatterns.test(text) && text.length > 10) {
      return { language: 'en', confidence: 0.8 }
    }

    // Default to English if uncertain
    return { language: 'en', confidence: 0.5 }
  }

  /**
   * Translate text to English (for internal processing)
   */
  async translateToEnglish(text: string, sourceLanguage?: string): Promise<string> {
    // If already English or source is English, return as is
    if (sourceLanguage === 'en' || !sourceLanguage) {
      const detection = await this.detectLanguage(text)
      if (detection.language === 'en' && detection.confidence > 0.7) {
        return text
      }
    }

    // If source language is English, return as is
    if (sourceLanguage === 'en') {
      return text
    }

    // For MVP, if text is not English, we'll use LLM for translation
    // In production, can use LibreTranslate or other services
    if (this.config.provider === 'llm') {
      // For now, return text as-is and let LLM handle multilingual
      // LLMs like GPT-4 can understand multiple languages
      return text
    }

    // LibreTranslate implementation (if configured)
    if (this.config.provider === 'libretranslate') {
      return this.translateWithLibreTranslate(text, sourceLanguage || 'auto', 'en')
    }

    // MyMemory implementation (if configured)
    if (this.config.provider === 'mymemory') {
      return this.translateWithMyMemory(text, sourceLanguage || 'auto', 'en')
    }

    return text
  }

  /**
   * Translate text to target language
   */
  async translateToLanguage(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string> {
    // If target is English, use translateToEnglish
    if (targetLanguage === 'en') {
      return this.translateToEnglish(text, sourceLanguage)
    }

    // If source and target are same, return as is
    if (sourceLanguage === targetLanguage) {
      return text
    }

    // For MVP, LLM can handle translation
    if (this.config.provider === 'llm') {
      // LLM will handle translation in the response
      return text
    }

    // LibreTranslate implementation
    if (this.config.provider === 'libretranslate') {
      return this.translateWithLibreTranslate(
        text,
        sourceLanguage || 'auto',
        targetLanguage
      )
    }

    // MyMemory implementation
    if (this.config.provider === 'mymemory') {
      return this.translateWithMyMemory(text, sourceLanguage || 'auto', targetLanguage)
    }

    return text
  }

  /**
   * Translate using LibreTranslate API
   */
  private async translateWithLibreTranslate(
    text: string,
    source: string,
    target: string
  ): Promise<string> {
    try {
      const response = await fetch(`${this.config.apiUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({
          q: text,
          source: source,
          target: target,
          format: 'text',
        }),
      })

      if (!response.ok) {
        throw new Error(`LibreTranslate API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.translatedText || text
    } catch (error) {
      console.error('Error translating with LibreTranslate:', error)
      // Fallback to original text
      return text
    }
  }

  /**
   * Translate using MyMemory API
   */
  private async translateWithMyMemory(
    text: string,
    source: string,
    target: string
  ): Promise<string> {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`,
        {
          method: 'GET',
        }
      )

      if (!response.ok) {
        throw new Error(`MyMemory API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.responseData?.translatedText || text
    } catch (error) {
      console.error('Error translating with MyMemory:', error)
      // Fallback to original text
      return text
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'en', // English
      'hi', // Hindi
      'es', // Spanish
      'fr', // French
      'de', // German
      'it', // Italian
      'pt', // Portuguese
      'ru', // Russian
      'ja', // Japanese
      'ko', // Korean
      'zh', // Chinese
      'ar', // Arabic
    ]
  }
}

export const translationService = new TranslationService()
export type { LanguageDetectionResult }
