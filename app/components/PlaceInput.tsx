'use client'

import { useState, useRef, useEffect } from 'react'

interface Place {
  display_name: string
  place_id: number
  lat?: string
  lon?: string
}

interface PlaceInputProps {
  value: string
  onChange: (value: string) => void
  onTimezoneDetected?: (timezone: string) => void
  className?: string
}

export default function PlaceInput({ value, onChange, onTimezoneDetected, className = '' }: PlaceInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const searchPlaces = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WhisperingPalms/1.0',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }

      const data = await response.json()
      setSuggestions(data)
      setIsOpen(true)
    } catch (error) {
      console.error('Error fetching places:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const detectTimezoneFromText = (text: string) => {
    if (!text || text.length < 3) return null

    const timezoneMap: { [key: string]: string } = {
      'India': 'Asia/Kolkata',
      'United States': 'America/New_York',
      'United Kingdom': 'Europe/London',
      'UK': 'Europe/London',
      'Canada': 'America/Toronto',
      'Australia': 'Australia/Sydney',
      'Germany': 'Europe/Berlin',
      'France': 'Europe/Paris',
      'Japan': 'Asia/Tokyo',
      'China': 'Asia/Shanghai',
      'Brazil': 'America/Sao_Paulo',
      'Mexico': 'America/Mexico_City',
      'Russia': 'Europe/Moscow',
      'South Korea': 'Asia/Seoul',
      'Italy': 'Europe/Rome',
      'Spain': 'Europe/Madrid',
      'Netherlands': 'Europe/Amsterdam',
      'Belgium': 'Europe/Brussels',
      'Switzerland': 'Europe/Zurich',
      'Austria': 'Europe/Vienna',
      'Sweden': 'Europe/Stockholm',
      'Norway': 'Europe/Oslo',
      'Denmark': 'Europe/Copenhagen',
      'Finland': 'Europe/Helsinki',
      'Poland': 'Europe/Warsaw',
      'Greece': 'Europe/Athens',
      'Turkey': 'Europe/Istanbul',
      'Saudi Arabia': 'Asia/Riyadh',
      'UAE': 'Asia/Dubai',
      'United Arab Emirates': 'Asia/Dubai',
      'Singapore': 'Asia/Singapore',
      'Malaysia': 'Asia/Kuala_Lumpur',
      'Thailand': 'Asia/Bangkok',
      'Indonesia': 'Asia/Jakarta',
      'Philippines': 'Asia/Manila',
      'Vietnam': 'Asia/Ho_Chi_Minh',
      'Pakistan': 'Asia/Karachi',
      'Bangladesh': 'Asia/Dhaka',
      'Nepal': 'Asia/Kathmandu',
      'Sri Lanka': 'Asia/Colombo',
    }

    const textLower = text.toLowerCase()
    for (const [country, tz] of Object.entries(timezoneMap)) {
      if (textLower.includes(country.toLowerCase())) {
        return tz
      }
    }

    if (textLower.includes('pune') || textLower.includes('mumbai') || textLower.includes('delhi') ||
      textLower.includes('bangalore') || textLower.includes('chennai') || textLower.includes('kolkata') ||
      textLower.includes('hyderabad') || textLower.includes('ahmedabad') || textLower.includes('jaipur')) {
      return 'Asia/Kolkata'
    }

    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    if (onTimezoneDetected && newValue.length > 3) {
      const detectedTz = detectTimezoneFromText(newValue)
      if (detectedTz) {
        onTimezoneDetected(detectedTz)
      }
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(newValue)
    }, 300)
  }

  const getTimezoneFromPlace = async (place: Place): Promise<string> => {
    try {
      const parts = place.display_name.split(',')
      const country = parts[parts.length - 1]?.trim() || ''

      const timezoneMap: { [key: string]: string } = {
        'India': 'Asia/Kolkata',
        'United States': 'America/New_York',
        'United Kingdom': 'Europe/London',
        'UK': 'Europe/London',
        'Canada': 'America/Toronto',
        'Australia': 'Australia/Sydney',
        'Germany': 'Europe/Berlin',
        'France': 'Europe/Paris',
        'Japan': 'Asia/Tokyo',
        'China': 'Asia/Shanghai',
        'Brazil': 'America/Sao_Paulo',
        'Mexico': 'America/Mexico_City',
        'Russia': 'Europe/Moscow',
        'South Korea': 'Asia/Seoul',
        'Italy': 'Europe/Rome',
        'Spain': 'Europe/Madrid',
        'Netherlands': 'Europe/Amsterdam',
        'Belgium': 'Europe/Brussels',
        'Switzerland': 'Europe/Zurich',
        'Austria': 'Europe/Vienna',
        'Sweden': 'Europe/Stockholm',
        'Norway': 'Europe/Oslo',
        'Denmark': 'Europe/Copenhagen',
        'Finland': 'Europe/Helsinki',
        'Poland': 'Europe/Warsaw',
        'Greece': 'Europe/Athens',
        'Turkey': 'Europe/Istanbul',
        'Saudi Arabia': 'Asia/Riyadh',
        'UAE': 'Asia/Dubai',
        'United Arab Emirates': 'Asia/Dubai',
        'Singapore': 'Asia/Singapore',
        'Malaysia': 'Asia/Kuala_Lumpur',
        'Thailand': 'Asia/Bangkok',
        'Indonesia': 'Asia/Jakarta',
        'Philippines': 'Asia/Manila',
        'Vietnam': 'Asia/Ho_Chi_Minh',
        'Pakistan': 'Asia/Karachi',
        'Bangladesh': 'Asia/Dhaka',
        'Nepal': 'Asia/Kathmandu',
        'Sri Lanka': 'Asia/Colombo',
      }

      if (timezoneMap[country]) {
        return timezoneMap[country]
      }

      const countryLower = country.toLowerCase()
      for (const [key, tz] of Object.entries(timezoneMap)) {
        const keyLower = key.toLowerCase()
        if (keyLower === countryLower || countryLower.includes(keyLower) || keyLower.includes(countryLower)) {
          return tz
        }
      }

      const displayNameLower = place.display_name.toLowerCase()
      for (const [key, tz] of Object.entries(timezoneMap)) {
        if (displayNameLower.includes(key.toLowerCase())) {
          return tz
        }
      }

      if (place.lat && place.lon) {
        const longitude = parseFloat(place.lon)
        const latitude = parseFloat(place.lat)

        if (longitude >= 68 && longitude <= 97 && latitude >= 6 && latitude <= 37) {
          return 'Asia/Kolkata'
        }
        if (longitude >= -125 && longitude <= -66 && latitude >= 24 && latitude <= 50) {
          return 'America/New_York'
        }
        if (longitude >= -5 && longitude <= 2 && latitude >= 50 && latitude <= 60) {
          return 'Europe/London'
        }
      }

      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (error) {
      console.error('Error detecting timezone:', error)
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  const handleSelect = async (place: Place) => {
    onChange(place.display_name)
    setSuggestions([])
    setIsOpen(false)

    if (onTimezoneDetected) {
      try {
        const timezone = await getTimezoneFromPlace(place)
        onTimezoneDetected(timezone)
      } catch (error) {
        console.error('Error detecting timezone:', error)
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        onTimezoneDetected(browserTimezone)
      }
    }
  }

  const formatPlaceName = (displayName: string) => {
    const parts = displayName.split(',')
    if (parts.length > 3) {
      return parts.slice(0, 3).join(',')
    }
    return displayName
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setIsOpen(true)
          }
        }}
        className="w-full px-4 py-3 bg-white border border-beige-300 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all"
        placeholder="Start typing place name (e.g., India, Pune)"
      />

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold-500"></div>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-beige-300 rounded-xl shadow-soft-xl max-h-60 overflow-y-auto">
          {suggestions.map((place) => (
            <button
              key={place.place_id}
              type="button"
              onClick={() => handleSelect(place)}
              className="w-full px-4 py-3 text-left text-text-primary hover:bg-beige-50 transition-colors border-b border-beige-200 last:border-b-0"
            >
              <div className="font-medium">{formatPlaceName(place.display_name)}</div>
            </button>
          ))}
        </div>
      )}

      {isOpen && value && suggestions.length === 0 && !loading && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-beige-300 rounded-xl shadow-soft-xl p-4">
          <p className="text-text-tertiary text-sm">No locations found. Try a different search term.</p>
        </div>
      )}
    </div>
  )
}
