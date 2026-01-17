/**
 * Translation utility using MyMemory Translation API (free)
 * Translates UI content dynamically with batching and rate limiting
 */

const TRANSLATE_API = 'https://api.mymemory.translated.net/get'

interface TranslationCache {
  [key: string]: {
    [lang: string]: string
  }
}

// Cache translations to avoid repeated API calls
const translationCache: TranslationCache = {}

// Rate limiting: Max 5 requests per second (MyMemory free tier limit)
const MAX_REQUESTS_PER_SECOND = 5
const REQUEST_DELAY_MS = 1000 / MAX_REQUESTS_PER_SECOND // 200ms between requests

// Request queue and timing
interface TranslationRequest {
  text: string
  targetLang: string
  sourceLang: string
  resolve: (value: string) => void
  reject: (error: any) => void
  cancelled?: boolean
}

let requestQueue: TranslationRequest[] = []
let isProcessingQueue = false
let lastRequestTime = 0
let currentLanguage = 'en' // Track current language to cancel requests on change
let activeRequests = new Map<string, TranslationRequest>() // Track active requests by cache key

/**
 * Cancel all pending requests for a specific language
 */
export function cancelTranslationsForLanguage(lang: string) {
  console.log(`[Translation] 🚫 Cancelling all requests for language: ${lang}`)
  currentLanguage = lang
  
  // Cancel all requests in queue for different language
  requestQueue = requestQueue.filter(req => {
    if (req.targetLang !== lang) {
      req.cancelled = true
      req.reject(new Error(`Translation cancelled: language changed to ${lang}`))
      return false
    }
    return true
  })
  
  // Cancel active requests
  activeRequests.forEach((req, key) => {
    if (req.targetLang !== lang) {
      req.cancelled = true
      req.reject(new Error(`Translation cancelled: language changed to ${lang}`))
      activeRequests.delete(key)
    }
  })
}

/**
 * Process translation queue with rate limiting
 */
async function processTranslationQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return
  }

  isProcessingQueue = true

  while (requestQueue.length > 0) {
    // Check if language changed
    if (requestQueue.length === 0) break
    
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime

    // Rate limiting: wait if needed
    if (timeSinceLastRequest < REQUEST_DELAY_MS) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS - timeSinceLastRequest))
    }

    const request = requestQueue.shift()
    if (!request || request.cancelled) continue

    // Check if request is still valid (language hasn't changed)
    if (request.targetLang !== currentLanguage) {
      console.log(`[Translation] ⏭️ Skipping request - language changed to ${currentLanguage}`)
      request.cancelled = true
      request.reject(new Error(`Translation cancelled: language changed`))
      continue
    }

    const cacheKey = `${request.sourceLang}-${request.targetLang}`
    const requestKey = `${request.text}-${cacheKey}`
    
    // Check if already active
    if (activeRequests.has(requestKey)) {
      console.log(`[Translation] ⏭️ Skipping duplicate request: ${requestKey}`)
      continue
    }

    // Mark as active
    activeRequests.set(requestKey, request)
    lastRequestTime = Date.now()

    try {
      const translated = await translateTextDirect(
        request.text,
        request.targetLang,
        request.sourceLang
      )
      
      // Remove from active requests
      activeRequests.delete(requestKey)
      
      if (!request.cancelled) {
        request.resolve(translated)
      }
    } catch (error) {
      activeRequests.delete(requestKey)
      if (!request.cancelled) {
        request.reject(error)
      }
    }
  }

  isProcessingQueue = false
}

/**
 * Direct translation API call (internal use)
 */
async function translateTextDirect(
  text: string,
  targetLang: string,
  sourceLang: string = 'en'
): Promise<string> {
  // Return original if same language
  if (targetLang === sourceLang || !text.trim()) {
    return text
  }

  // Check cache first
  const cacheKey = `${sourceLang}-${targetLang}`
  if (translationCache[text]?.[cacheKey]) {
    return translationCache[text][cacheKey]
  }

  try {
    const response = await fetch(
      `${TRANSLATE_API}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    )

    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`[Translation] Rate limited (429). Waiting before retry...`)
        // Wait longer if rate limited
        await new Promise(resolve => setTimeout(resolve, 2000))
        // Retry once
        const retryResponse = await fetch(
          `${TRANSLATE_API}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
        )
        if (!retryResponse.ok) {
          console.warn('[Translation] Retry failed, returning original text')
          return text
        }
        const retryData = await retryResponse.json()
        if (retryData.responseStatus === 200 && retryData.responseData?.translatedText) {
          const translated = retryData.responseData.translatedText
          if (!translationCache[text]) {
            translationCache[text] = {}
          }
          translationCache[text][cacheKey] = translated
          return translated
        }
        return text
      }
      console.warn(`[Translation] API failed (${response.status}), returning original text`)
      return text
    }

    const data = await response.json()

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText

      // Cache the translation
      if (!translationCache[text]) {
        translationCache[text] = {}
      }
      translationCache[text][cacheKey] = translated

      return translated
    }

    return text
  } catch (error) {
    console.warn('[Translation] Error:', error)
    return text
  }
}

/**
 * Translate text to target language (with rate limiting and queuing)
 * ONLY translates from English (en) to target language - never reverse
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'en'
): Promise<string> {
  // CRITICAL: Only translate from English to target language
  // Never translate from target language back to English or between non-English languages
  if (sourceLang !== 'en') {
    console.warn(`[Translation] ⚠️ Skipping reverse translation: ${sourceLang} -> ${targetLang}. Only en -> targetLang allowed.`)
    return text
  }

  // Return original if same language or empty
  if (targetLang === sourceLang || targetLang === 'en' || !text.trim()) {
    return text
  }

  // Check cache first
  const cacheKey = `${sourceLang}-${targetLang}`
  if (translationCache[text]?.[cacheKey]) {
    return translationCache[text][cacheKey]
  }

  // Check if request already active or queued - prevent duplicates
  const requestKey = `${text}-${cacheKey}`
  if (activeRequests.has(requestKey)) {
    console.log(`[Translation] ⏳ Request already active: ${requestKey}, waiting...`)
    // Wait for the active request to complete
    const activeReq = activeRequests.get(requestKey)!
    return new Promise((resolve, reject) => {
      // Create a wrapper that calls both the original and new callbacks
      const wrapperResolve = (value: string) => {
        activeReq.resolve(value)
        resolve(value)
      }
      const wrapperReject = (error: any) => {
        activeReq.reject(error)
        reject(error)
      }
      activeReq.resolve = wrapperResolve
      activeReq.reject = wrapperReject
    })
  }
  
  // Check if already in queue
  const inQueue = requestQueue.some(req => 
    req.text === text && req.targetLang === targetLang && req.sourceLang === sourceLang && !req.cancelled
  )
  if (inQueue) {
    console.log(`[Translation] ⏳ Request already in queue: ${requestKey}`)
    // Return a promise that will resolve when queue processes it
    return new Promise((resolve, reject) => {
      // Find the existing request in queue and add our callbacks
      const existingReq = requestQueue.find(req => 
        req.text === text && req.targetLang === targetLang && req.sourceLang === sourceLang && !req.cancelled
      )
      if (existingReq) {
        const originalResolve = existingReq.resolve
        const originalReject = existingReq.reject
        existingReq.resolve = (value: string) => {
          originalResolve(value)
          resolve(value)
        }
        existingReq.reject = (error: any) => {
          originalReject(error)
          reject(error)
        }
      } else {
        resolve(text) // Fallback
      }
    })
  }

  // Queue the request with rate limiting
  return new Promise((resolve, reject) => {
    const request: TranslationRequest = {
      text,
      targetLang,
      sourceLang,
      resolve,
      reject,
      cancelled: false,
    }
    
    requestQueue.push(request)

    // Start processing queue if not already processing
    processTranslationQueue().catch(reject)
  })
}

/**
 * Batch translate ALL texts for a language in ONE API call sequence
 * This is the ONLY way translations should happen - never individually
 */
let batchTranslationInProgress = false
let batchTranslationPromise: Promise<void> | null = null

export async function translateAllTextsForLanguage(
  allTexts: string[],
  targetLang: string,
  sourceLang: string = 'en'
): Promise<Map<string, string>> {
  // Early returns
  if (targetLang === sourceLang || targetLang === 'en' || sourceLang !== 'en') {
    return new Map()
  }

  // Filter out already cached texts
  const textsToTranslate: string[] = []
  const cacheKey = `${sourceLang}-${targetLang}`
  const results = new Map<string, string>()

  for (const text of allTexts) {
    if (!text.trim()) continue
    
    if (translationCache[text]?.[cacheKey]) {
      results.set(text, translationCache[text][cacheKey])
    } else {
      textsToTranslate.push(text)
    }
  }

  if (textsToTranslate.length === 0) {
    return results
  }

  console.log(`[Translation] 📦 Batch translating ${textsToTranslate.length} texts to ${targetLang}`)

  // Translate in batches of 10 (to avoid URL length limits)
  const BATCH_SIZE = 10
  for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
    const batch = textsToTranslate.slice(i, i + BATCH_SIZE)
    
    // Rate limiting: wait between batches
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS))
    }

    // Translate batch sequentially (one API call per text, but batched)
    for (const text of batch) {
      try {
        const translated = await translateTextDirect(text, targetLang, sourceLang)
        results.set(text, translated)
        
        // Cache it
        if (!translationCache[text]) {
          translationCache[text] = {}
        }
        translationCache[text][cacheKey] = translated
        
        // Small delay between requests in batch
        if (batch.indexOf(text) < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS))
        }
      } catch (error) {
        console.warn(`[Translation] Failed to translate "${text}":`, error)
        results.set(text, text) // Fallback to original
      }
    }
  }

  console.log(`[Translation] ✅ Batch translation complete: ${results.size} texts translated`)
  return results
}

/**
 * Translate multiple texts in batch (deprecated - use translateAllTextsForLanguage)
 */
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang: string = 'en'
): Promise<string[]> {
  if (targetLang === sourceLang) {
    return texts
  }

  // Use the new batch function
  const results = await translateAllTextsForLanguage(texts, targetLang, sourceLang)
  return texts.map(text => results.get(text) || text)
}

/**
 * Get language name in native script
 */
export function getLanguageName(code: string): string {
  const languages: { [key: string]: string } = {
    en: 'English',
    hi: 'हिन्दी',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ru: 'Русский',
    ja: '日本語',
    zh: '中文',
    ar: 'العربية',
    bn: 'বাংলা',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    mr: 'मराठी',
    gu: 'ગુજરાતી',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം',
    pa: 'ਪੰਜਾਬੀ',
    ur: 'اردو',
    ko: '한국어',
    th: 'ไทย',
    vi: 'Tiếng Việt',
    id: 'Bahasa Indonesia',
    tr: 'Türkçe',
    pl: 'Polski',
    nl: 'Nederlands',
    sv: 'Svenska',
    no: 'Norsk',
    fi: 'Suomi',
    da: 'Dansk',
    cs: 'Čeština',
    hu: 'Magyar',
    ro: 'Română',
    el: 'Ελληνικά',
    he: 'עברית',
    uk: 'Українська',
  }
  return languages[code] || code
}
