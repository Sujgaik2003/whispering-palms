'use client'

import Link from 'next/link'
import { useI18n } from '@/app/hooks/useI18n'

export default function GlobalFooter() {
    const { t } = useI18n()

    const footerFeatures = [
        { icon: 'lock', text: t('home.securePrivate'), href: '/security' },
        { icon: 'star', text: t('home.expertAstrologer'), href: '/experts' },
        { icon: 'book', text: t('home.vedicWisdom'), href: '/knowledge' }
    ]

    return (
        <footer className="mt-16 sm:mt-24 md:mt-32 pt-6 sm:pt-8 border-t border-beige-300/50 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-xs sm:text-sm text-text-tertiary px-2 max-w-7xl mx-auto">
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
                    {footerFeatures.map((item, idx) => (
                        <Link
                            key={idx}
                            href={item.href}
                            className="flex items-center gap-2 hover:text-text-primary transition-colors duration-300 cursor-pointer group"
                        >
                            {item.icon === 'lock' && (
                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            )}
                            {item.icon === 'star' && (
                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            )}
                            {item.icon === 'book' && (
                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            )}
                            <span>{item.text}</span>
                        </Link>
                    ))}
                </div>
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
                    <Link href="/terms" className="hover:text-text-primary transition-colors duration-300 hover:underline whitespace-nowrap">
                        {t('home.termsConditions')}
                    </Link>
                    <Link href="/privacy" className="hover:text-text-primary transition-colors duration-300 hover:underline whitespace-nowrap">
                        {t('home.privacyPolicy')}
                    </Link>
                </div>
            </div>
            <div className="text-center mt-4 sm:mt-6 text-text-light text-xs px-2">
                © {new Date().getFullYear()} {t('dashboard.title')} {t('home.astro')}. {t('home.copyright')}.
            </div>
        </footer>
    )
}
