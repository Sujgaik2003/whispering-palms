'use client'

import { useState, useRef, useEffect } from 'react'
import { COUNTRIES, filterCountries } from '@/lib/utils/countries'

interface CountryInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function CountryInput({ value, onChange, className = '' }: CountryInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredCountries = filterCountries(searchTerm)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (country: string) => {
    onChange(country)
    setSearchTerm('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setSearchTerm(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full px-4 py-3 bg-white border border-beige-300 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all"
        placeholder="Start typing country name..."
      />

      {isOpen && filteredCountries.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-beige-300 rounded-xl shadow-soft-xl max-h-60 overflow-y-auto">
          {filteredCountries.slice(0, 10).map((country) => (
            <button
              key={country}
              type="button"
              onClick={() => handleSelect(country)}
              className={`w-full px-4 py-2 text-left text-text-primary hover:bg-beige-50 transition-colors ${value === country ? 'bg-gold-50 text-gold-700' : ''
                }`}
            >
              {country}
            </button>
          ))}
        </div>
      )}

      {isOpen && searchTerm && filteredCountries.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-beige-300 rounded-xl shadow-soft-xl p-4">
          <p className="text-text-tertiary text-sm">No countries found</p>
        </div>
      )}
    </div>
  )
}
