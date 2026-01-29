'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
}

export default function TimePicker({ value, onChange, className = '' }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)
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
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      if (buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect())
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Update rect on scroll or resize when open
  useEffect(() => {
    const updateRect = () => {
      if (isOpen && buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect())
      }
    }

    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [isOpen])

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
    <div className={`relative ${className}`} ref={buttonRef}>
      <input
        type="text"
        value={formatDisplayTime(value)}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-beige-300 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all cursor-pointer"
        placeholder="Select time of birth"
      />

      {mounted && isOpen && buttonRect && createPortal(
        <div
          ref={dropdownRef}
          className="bg-white border border-beige-300 rounded-[2rem] shadow-soft-2xl p-4 sm:p-6 w-[300px] xs:w-[350px] origin-top animate-scale-in"
          style={{
            zIndex: 2147483647,
            position: 'fixed',
            top: `${buttonRect.bottom + 8}px`,
            left: `${Math.min(window.innerWidth - (window.innerWidth < 420 ? 312 : 362), Math.max(12, buttonRect.left))}px`
          }}
        >
          <div className="flex gap-4 sm:gap-6">
            {/* Hours */}
            <div className="flex-1 min-w-[70px]">
              <div className="text-center text-text-tertiary text-[10px] font-bold mb-3 uppercase tracking-[0.15em] font-sans">Hour</div>
              <div className="max-h-[220px] overflow-y-auto space-y-1.5 scrollbar-hide py-1">
                {hourOptions.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleTimeChange(hour, minutes, isAM)}
                    className={`w-full py-2.5 rounded-xl transition-all text-sm font-bold ${hours === hour
                      ? 'bg-gold-500 text-white shadow-soft-lg scale-105 z-10'
                      : 'text-text-primary hover:bg-beige-50'
                      }`}
                  >
                    {hour.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1 min-w-[70px]">
              <div className="text-center text-text-tertiary text-[10px] font-bold mb-3 uppercase tracking-[0.15em] font-sans">Minute</div>
              <div className="max-h-[220px] overflow-y-auto space-y-1.5 scrollbar-hide py-1">
                {minuteOptions.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleTimeChange(hours, minute, isAM)}
                    className={`w-full py-2.5 rounded-xl transition-all text-sm font-bold ${minutes === minute
                      ? 'bg-gold-500 text-white shadow-soft-lg scale-105 z-10'
                      : 'text-text-primary hover:bg-beige-50'
                      }`}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col gap-3 min-w-[80px]">
              <div className="text-center text-text-tertiary text-[10px] font-bold mb-3 uppercase tracking-[0.15em] font-sans">Period</div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleTimeChange(hours, minutes, true)}
                  className={`w-full py-3.5 rounded-xl transition-all text-xs font-black tracking-widest ${isAM
                    ? 'bg-gold-500 text-white shadow-soft-lg scale-105 z-10'
                    : 'text-text-primary border-2 border-beige-100 hover:border-gold-300 hover:bg-beige-50'
                    }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeChange(hours, minutes, false)}
                  className={`w-full py-3.5 rounded-xl transition-all text-xs font-black tracking-widest ${!isAM
                    ? 'bg-gold-500 text-white shadow-soft-lg scale-105 z-10'
                    : 'text-text-primary border-2 border-beige-100 hover:border-gold-300 hover:bg-beige-50'
                    }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
