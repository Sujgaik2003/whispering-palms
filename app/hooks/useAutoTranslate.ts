'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/app/contexts/TranslationContext'
import { translateText } from '@/lib/utils/translation'

/**
 * Hook that automatically translates all text content on the page
 */
export function useAutoTranslate() {
  const { language } = useTranslation()

  useEffect(() => {
    if (language === 'en') {
      // Reset translations when switching back to English
      document.querySelectorAll('[data-translated]').forEach(el => {
        el.removeAttribute('data-translated')
      })
      return
    }

    const translateAllText = async () => {
      // Store original texts before translating
      const originalTexts = new Map<Node, string>()
      
      // Get all text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip script and style tags
            const parent = node.parentElement
            if (!parent) return NodeFilter.FILTER_REJECT
            if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'NOSCRIPT') {
              return NodeFilter.FILTER_REJECT
            }
            // Skip if already translated (has data-translated attribute)
            if (parent.hasAttribute('data-translated')) {
              return NodeFilter.FILTER_REJECT
            }
            // Skip language switcher and other UI elements that shouldn't be translated
            if (parent.closest('[data-no-translate]')) {
              return NodeFilter.FILTER_REJECT
            }
            // Only translate if text is meaningful (not just whitespace, numbers, or single chars)
            const text = node.textContent || ''
            if (text.trim().length > 1 && !/^\d+$/.test(text.trim()) && text.trim().length < 500) {
              originalTexts.set(node, text)
              return NodeFilter.FILTER_ACCEPT
            }
            return NodeFilter.FILTER_REJECT
          }
        }
      )

      const textNodes: Node[] = []
      let node
      while ((node = walker.nextNode())) {
        textNodes.push(node)
      }

      // Translate in parallel batches for faster translation
      const batchSize = 5
      let translatedCount = 0
      
      // Process in parallel batches for instant translation
      const batches = []
      for (let i = 0; i < textNodes.length; i += batchSize) {
        batches.push(textNodes.slice(i, i + batchSize))
      }
      
      // Process all batches in parallel for instant translation
      await Promise.all(
        batches.map(async (batch, batchIndex) => {
          await Promise.all(
            batch.map(async (textNode) => {
              const originalText = originalTexts.get(textNode) || textNode.textContent || ''
              if (!originalText || originalText.trim().length === 0) return

              try {
                const translated = await translateText(originalText.trim(), language, 'en')
                if (translated && translated !== originalText && translated.trim().length > 0) {
                  textNode.textContent = translated
                  translatedCount++
                  // Mark parent as translated
                  if (textNode.parentElement) {
                    textNode.parentElement.setAttribute('data-translated', 'true')
                    textNode.parentElement.setAttribute('data-original-text', originalText)
                  }
                }
              } catch (error) {
                // Silently continue - don't block other translations
              }
            })
          )
          // Minimal delay between batches to avoid overwhelming the API
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        })
      )
      
      if (translatedCount > 0) {
        console.log(`✅ Translated ${translatedCount} text nodes to ${language}`)
      }
    }

    // Translate immediately when language changes
    const translate = async () => {
      // Clear previous translations
      document.querySelectorAll('[data-translated]').forEach(el => {
        el.removeAttribute('data-translated')
      })
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 50))
      await translateAllText()
    }

    translate()

    const handleTranslate = async (event?: CustomEvent) => {
      // Clear previous translations
      document.querySelectorAll('[data-translated]').forEach(el => {
        el.removeAttribute('data-translated')
      })
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 50))
      await translateAllText()
    }

    // Listen for immediate translation triggers
    window.addEventListener('translatePage', handleTranslate as EventListener)
    window.addEventListener('languageChanged', handleTranslate as EventListener)

    return () => {
      window.removeEventListener('translatePage', handleTranslate as EventListener)
      window.removeEventListener('languageChanged', handleTranslate as EventListener)
    }
  }, [language])
}
