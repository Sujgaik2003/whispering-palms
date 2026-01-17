'use client'

import { useState, useRef, useEffect } from 'react'

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
}

export default function TimePicker({ value, onChange, className = '' }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hours, setHours] = useState(() => {
    if (value) {
      const [h] = value.split(':')
      return parseInt(h) || 12
    }
    return 12
  })
  const [minutes, setMinutes] = useState(() => {
    if (value) {
      const [, m] = value.split(':')
      return parseInt(m) || 0
    }
    return 0
  })
  const [isAM, setIsAM] = useState(() => {
    if (value) {
      const [h] = value.split(':')
      return parseInt(h) < 12
    }
    return true
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatTime = (h: number, m: number, am: boolean) => {
    let hour24 = h
    if (!am && h !== 12) hour24 = h + 12
    if (am && h === 12) hour24 = 0
    return `${hour24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const handleTimeChange = (newHours: number, newMinutes: number, newIsAM: boolean) => {
    setHours(newHours)
    setMinutes(newMinutes)
    setIsAM(newIsAM)
    const timeString = formatTime(newHours, newMinutes, newIsAM)
    onChange(timeString)
  }

  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return ''
    const [h, m] = timeString.split(':')
    const hour = parseInt(h)
    const minute = parseInt(m)
    const isAM = hour < 12
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${isAM ? 'AM' : 'PM'}`
  }

  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <input
        type="text"
        value={formatDisplayTime(value)}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-beige-300 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all cursor-pointer"
        placeholder="Select time of birth"
      />

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-beige-300 rounded-xl shadow-soft-xl p-4 w-64">
          <div className="flex gap-4">
            {/* Hours */}
            <div className="flex-1">
              <div className="text-center text-text-secondary text-sm font-semibold mb-2">Hour</div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {hourOptions.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleTimeChange(hour, minutes, isAM)}
                    className={`w-full px-3 py-2 rounded transition-colors ${hours === hour
                        ? 'bg-gold-500 text-white'
                        : 'text-text-primary hover:bg-beige-50'
                      }`}
                  >
                    {hour.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="text-center text-text-secondary text-sm font-semibold mb-2">Minute</div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {minuteOptions.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleTimeChange(hours, minute, isAM)}
                    className={`w-full px-3 py-2 rounded transition-colors ${minutes === minute
                        ? 'bg-gold-500 text-white'
                        : 'text-text-primary hover:bg-beige-50'
                      }`}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col gap-2">
              <div className="text-center text-text-secondary text-sm font-semibold mb-2">Period</div>
              <button
                type="button"
                onClick={() => handleTimeChange(hours, minutes, true)}
                className={`px-4 py-2 rounded transition-colors ${isAM ? 'bg-gold-500 text-white' : 'text-text-primary hover:bg-beige-50'
                  }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handleTimeChange(hours, minutes, false)}
                className={`px-4 py-2 rounded transition-colors ${!isAM ? 'bg-gold-500 text-white' : 'text-text-primary hover:bg-beige-50'
                  }`}
              >
                PM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
