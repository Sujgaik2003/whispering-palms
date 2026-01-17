'use client'

import { useState, useEffect, useRef } from 'react'
import Toast from './Toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
  question_id?: string
  answer_id?: string
}

interface ChatProps {
  initialMessages?: Message[]
}

export default function Chat({ initialMessages = [] }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [quota, setQuota] = useState<{
    used: number
    remaining: number
    max: number
    resetAt: string
    percentage: number
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  })

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadMessages()
    loadQuota()
  }, [])

  const loadQuota = async () => {
    try {
      const response = await fetch('/api/quota')
      const result = await response.json()

      if (response.ok && result.data?.quota) {
        setQuota(result.data.quota)
      }
    } catch (error) {
      console.error('Error loading quota:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/questions?limit=50')
      const result = await response.json()

      if (response.ok && result.data?.questions) {
        const chatMessages: Message[] = []
        result.data.questions.forEach((q: any) => {
          chatMessages.push({
            id: q.id,
            role: 'user',
            content: q.text_original,
            created_at: q.created_at,
            question_id: q.id,
          })
          if (q.answers && q.answers.length > 0) {
            chatMessages.push({
              id: q.answers[0].id,
              role: 'assistant',
              content: q.answers[0].text,
              created_at: q.answers[0].created_at,
              answer_id: q.answers[0].id,
            })
          }
        })
        setMessages(chatMessages.reverse())
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || submitting) return

    const questionText = input.trim()
    setInput('')
    setSubmitting(true)

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: questionText,
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const questionResponse = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: questionText,
          category: 'general',
        }),
      })

      const questionResult = await questionResponse.json()

      if (!questionResponse.ok) {
        // TODO: Uncomment for production - if (questionResponse.status === 429) {
        //   showToast(questionResult.error?.message || 'Daily quota exhausted', 'warning')
        //   return
        // }
        throw new Error(questionResult.error?.message || 'Failed to submit question')
      }

      const questionId = questionResult.data.question.id

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? { ...msg, id: questionId, question_id: questionId }
            : msg
        )
      )

      const loadingMessage: Message = {
        id: `loading-${Date.now()}`,
        role: 'assistant',
        content: 'typing',
      }
      setMessages((prev) => [...prev, loadingMessage])

      const answerResponse = await fetch('/api/questions/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionId,
        }),
      })

      const answerResult = await answerResponse.json()

      if (!answerResponse.ok) {
        setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessage.id))

        if (answerResponse.status === 503) {
          showToast(
            'AnythingLLM service is not available. Please ensure Docker containers are running.',
            'error'
          )
        } else {
          showToast(answerResult.error?.message || 'Failed to generate answer', 'error')
        }
        return
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
              id: answerResult.data.answer.id,
              role: 'assistant',
              content: answerResult.data.answer.text,
              created_at: answerResult.data.answer.created_at,
              answer_id: answerResult.data.answer.id,
            }
            : msg
        )
      )

      if (answerResult.data.quota) {
        setQuota((prev) => {
          if (!prev) {
            loadQuota()
            return null
          }
          return {
            ...prev,
            remaining: answerResult.data.quota.remaining,
            used: answerResult.data.quota.used,
            max: answerResult.data.quota.max,
            percentage: Math.round((answerResult.data.quota.used / answerResult.data.quota.max) * 100),
          }
        })
      }

      showToast('Answer generated successfully!', 'success')
    } catch (error) {
      console.error('Error submitting question:', error)
      showToast(
        error instanceof Error ? error.message : 'An error occurred',
        'error'
      )
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-soft">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center animate-fade-in">
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 border border-beige-300/50 shadow-soft-xl">
                  <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full shadow-soft animate-pulse-soft">
                      <svg
                        className="w-16 h-16 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-text-primary mb-2 font-serif">Start a conversation</h3>
                  <p className="text-text-secondary text-lg">
                    Ask Aarav Dev anything about your future, palmistry, or astrology
                  </p>
                  <p className="text-text-tertiary text-sm mt-2">
                    Get personalized guidance based on your birth chart and palm reading
                  </p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              if (message.content === 'typing') {
                return (
                  <div key={message.id} className="flex justify-start items-start gap-3 animate-slide-up">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-soft">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm border border-beige-300/50 rounded-2xl p-5 shadow-soft">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="ml-2 text-sm text-text-secondary">Aarav Dev is typing...</span>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3 animate-slide-up`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-soft">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl p-5 shadow-soft transition-all hover:shadow-soft-lg ${message.role === 'user'
                      ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-white'
                      : 'bg-white/80 backdrop-blur-sm border border-beige-300/50 text-text-primary'
                      }`}
                  >
                    <div className="whitespace-pre-wrap break-words text-base leading-relaxed">
                      {message.content}
                    </div>
                    {message.created_at && (
                      <div className={`text-xs mt-3 ${message.role === 'user' ? 'text-white/70' : 'text-text-tertiary'
                        }`}>
                        {new Date(message.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-peach-400 to-peach-500 flex items-center justify-center shadow-soft">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Container */}
      <div className="border-t border-beige-300/50 bg-white/60 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto p-4">
          {quota && (
            <div className="mb-3 px-4 py-2 bg-beige-50 rounded-xl border border-beige-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">
                  Daily Questions: {quota.used} / {quota.max}
                </span>
                <span className={`font-semibold ${quota.remaining === 0
                  ? 'text-red-500'
                  : quota.remaining <= 1
                    ? 'text-yellow-500'
                    : 'text-green-600'
                  }`}>
                  {quota.remaining} remaining
                </span>
              </div>
              <div className="mt-2 w-full bg-beige-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${quota.percentage >= 100
                    ? 'bg-red-500'
                    : quota.percentage >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                    }`}
                  style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your question about your future, palmistry, or astrology..."
                className="w-full bg-white border border-beige-300 rounded-xl px-5 py-4 text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all text-base shadow-soft"
                disabled={submitting}
                maxLength={1000}
              />
              <div className="absolute bottom-2 right-3 text-xs text-text-tertiary">
                {input.length}/1000
              </div>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || submitting}
              className="px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-soft hover:shadow-soft-lg transform hover:scale-[1.02] flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  )
}
