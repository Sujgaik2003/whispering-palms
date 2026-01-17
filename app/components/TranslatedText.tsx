'use client'

import { useTranslatedText } from '@/app/hooks/useTranslatedText'

interface TranslatedTextProps {
  children: string
  fallback?: string
}

export default function TranslatedText({ children, fallback }: TranslatedTextProps) {
  const translated = useTranslatedText(children)
  return <>{translated || fallback || children}</>
}
