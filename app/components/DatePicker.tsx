'use client'

import { useState, useRef, useEffect } from 'react'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  className?: string
  max?: string
}

export default function DatePicker({ value, onChange, className = '', max }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (value) return new Date(value).getFullYear()
    return new Date().getFullYear()
  })
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (value) return new Date(value).getMonth()
    return new Date().getMonth()
  })
  const [showYearPicker, setShowYearPicker] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentDate = new Date()
  const maxDate = max ? new Date(max) : currentDate
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handleDateSelect = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day)
    const formattedDate = date.toISOString().split('T')[0]
    onChange(formattedDate)
    setIsOpen(false)
  }

  const isDateDisabled = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day)
    return date > maxDate
  }

  const isSelectedDate = (day: number) => {
    if (!value) return false
    const selected = new Date(value)
    return (
      selected.getFullYear() === selectedYear &&
      selected.getMonth() === selectedMonth &&
      selected.getDate() === day
    )
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
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
      setSelectedMonth(selectedMonth + 1)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <input
        type="text"
        value={formatDisplayDate(value)}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-beige-300 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all cursor-pointer"
        placeholder="Select date of birth"
      />

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-beige-300 rounded-xl shadow-soft-xl p-4 w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-2 text-text-primary hover:bg-beige-50 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="text-text-primary font-semibold hover:bg-beige-50 px-3 py-1 rounded transition-colors"
            >
              {months[selectedMonth]} {selectedYear}
            </button>
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={selectedYear >= currentYear && selectedMonth >= currentDate.getMonth()}
              className="p-2 text-text-primary hover:bg-beige-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Year Picker */}
          {showYearPicker && (
            <div className="mb-4 p-4 bg-beige-50 rounded-xl border border-beige-200">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedYear(selectedYear - 12)}
                  className="p-1 text-text-primary hover:bg-beige-100 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-text-primary font-semibold">
                  {selectedYear - 5} - {selectedYear + 6}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedYear(selectedYear + 12)}
                  disabled={selectedYear + 12 > currentYear}
                  className="p-1 text-text-primary hover:bg-beige-100 rounded transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {Array.from({ length: 12 }, (_, i) => selectedYear - 5 + i).map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setSelectedYear(year)
                      setShowYearPicker(false)
                    }}
                    disabled={year > currentYear}
                    className={`px-3 py-2 rounded transition-colors ${year === selectedYear
                        ? 'bg-gold-500 text-white'
                        : year > currentYear
                          ? 'text-text-tertiary cursor-not-allowed'
                          : 'text-text-primary hover:bg-beige-100'
                      }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-text-tertiary text-xs font-semibold py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="p-2" />
              }

              const disabled = isDateDisabled(day)
              const selected = isSelectedDate(day)

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  className={`p-2 text-sm rounded transition-colors ${disabled
                      ? 'text-text-tertiary cursor-not-allowed'
                      : selected
                        ? 'bg-gold-500 text-white'
                        : 'text-text-primary hover:bg-beige-100'
                    }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
