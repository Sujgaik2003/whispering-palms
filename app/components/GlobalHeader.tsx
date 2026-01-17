'use client'

import LanguageSwitcher from './LanguageSwitcher'

/**
 * Global header component with language switcher
 * Can be included on any page for consistent language switching
 */
export default function GlobalHeader() {
  return (
    <div className="fixed top-4 right-4 z-[999999]" data-no-translate>
      <LanguageSwitcher />
    </div>
  )
}
