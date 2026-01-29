'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  className?: string
  max?: string
}

export default function DatePicker({ value, onChange, className = '', max }: DatePickerProps) {
  // Helper to parse YYYY-MM-DD without timezone shifts
  const parseDate = (dateStr: string) => {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split('-').map(Number)
    return { year, month: month - 1, day }
  }

  const [isOpen, setIsOpen] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const parsed = parseDate(value)
    return parsed ? parsed.year : new Date().getFullYear()
  })
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const parsed = parseDate(value)
    return parsed ? parsed.month : new Date().getMonth()
  })
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  const currentDate = new Date()
  const maxDate = max ? new Date(max) : currentDate
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowYearPicker(false)
        setShowMonthPicker(false)
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

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handleDateSelect = (day: number) => {
    // Manually format to YYYY-MM-DD to avoid timezone shifts
    const m = (selectedMonth + 1).toString().padStart(2, '0')
    const d = day.toString().padStart(2, '0')
    const formattedDate = `${selectedYear}-${m}-${d}`
    onChange(formattedDate)
    setIsOpen(false)
  }

  const isDateDisabled = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day)
    return date > maxDate
  }

  const isSelectedDate = (day: number) => {
    if (!value) return false
    const parsed = parseDate(value)
    if (!parsed) return false
    return (
      parsed.year === selectedYear &&
      parsed.month === selectedMonth &&
      parsed.day === day
    )
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return ''
    const parsed = parseDate(dateString)
    if (!parsed) return ''
    const date = new Date(parsed.year, parsed.month, parsed.day)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth)

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      const nextMonthDate = new Date(selectedYear, selectedMonth + 1, 1)
      if (nextMonthDate <= maxDate) {
        setSelectedMonth(selectedMonth + 1)
      }
    }
  }

  return (
    <div className={`relative ${className}`} ref={buttonRef}>
      <input
        type="text"
        value={formatDisplayDate(value)}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-beige-300 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all cursor-pointer text-sm sm:text-base pr-10"
        placeholder="Select date of birth"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {mounted && isOpen && buttonRect && createPortal(
        <div
          ref={dropdownRef}
          className="bg-white border border-beige-300 rounded-2xl shadow-soft-2xl p-3 sm:p-4 w-[280px] xs:w-80 origin-top animate-scale-in"
          style={{
            zIndex: 2147483647,
            position: 'fixed',
            top: `${buttonRect.bottom + 8}px`,
            left: `${Math.min(window.innerWidth - (window.innerWidth < 420 ? 292 : 332), Math.max(12, buttonRect.left))}px`
          }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 bg-beige-50/50 rounded-xl p-1">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1.5 sm:p-2 text-text-primary hover:bg-white hover:shadow-sm rounded-lg transition-all"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMonthPicker(!showMonthPicker)
                  setShowYearPicker(false)
                }}
                className={`text-text-primary font-bold hover:bg-white hover:shadow-sm px-2 py-1 rounded-lg transition-all text-sm sm:text-base ${showMonthPicker ? 'bg-white shadow-sm' : ''}`}
              >
                {months[selectedMonth]}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowYearPicker(!showYearPicker)
                  setShowMonthPicker(false)
                }}
                className={`text-text-primary font-bold hover:bg-white hover:shadow-sm px-2 py-1 rounded-lg transition-all text-sm sm:text-base ${showYearPicker ? 'bg-white shadow-sm' : ''}`}
              >
                {selectedYear}
              </button>
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={selectedYear >= maxDate.getFullYear() && selectedMonth >= maxDate.getMonth()}
              className="p-1.5 sm:p-2 text-text-primary hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Month Picker */}
          {showMonthPicker && (
            <div className="absolute inset-x-3 sm:inset-x-4 top-[70px] bottom-3 sm:bottom-4 bg-white z-20 rounded-xl overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-3 gap-2 p-1">
                {months.map((month, idx) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(idx)
                      setShowMonthPicker(false)
                    }}
                    disabled={selectedYear === maxDate.getFullYear() && idx > maxDate.getMonth()}
                    className={`py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${idx === selectedMonth
                      ? 'bg-gold-500 text-white shadow-soft'
                      : (selectedYear === maxDate.getFullYear() && idx > maxDate.getMonth())
                        ? 'text-text-tertiary opacity-30 cursor-not-allowed'
                        : 'text-text-primary hover:bg-beige-50'
                      }`}
                  >
                    {month.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Year Picker */}
          {showYearPicker && (
            <div className="absolute inset-x-3 sm:inset-x-4 top-[70px] bottom-3 sm:bottom-4 bg-white z-20 rounded-xl overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-3 gap-2 p-1">
                {Array.from({ length: 121 }, (_, i) => currentYear - 100 + i).reverse().map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setSelectedYear(year)
                      setShowYearPicker(false)
                    }}
                    className={`py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${year === selectedYear
                      ? 'bg-gold-500 text-white shadow-soft'
                      : 'text-text-primary hover:bg-beige-50'
                      }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-text-tertiary text-[10px] sm:text-xs font-bold py-2 uppercase tracking-tighter">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="p-1" />
              }

              const disabled = isDateDisabled(day)
              const selected = isSelectedDate(day)

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  className={`aspect-square sm:p-2 text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center font-medium ${disabled
                    ? 'text-text-tertiary opacity-20 cursor-not-allowed'
                    : selected
                      ? 'bg-gold-500 text-white shadow-soft-lg scale-110 z-10'
                      : 'text-text-primary hover:bg-beige-50 hover:text-gold-600'
                    }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
