'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/app/hooks/useI18n'
import Toast from './Toast'
import { PaymentProvider, PlanType, BillingPeriod } from '@/lib/services/payment/types'
import { convertUSDToINR } from '@/lib/utils/currency'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  planType: PlanType
  billingPeriod: BillingPeriod
  amount: number
  currency?: string
  onSuccess?: () => void
}

export default function CheckoutModal({
  isOpen,
  onClose,
  planType,
  billingPeriod,
  amount,
  currency = 'USD',
  onSuccess,
}: CheckoutModalProps) {
  const { t } = useI18n()
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('stripe')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'provider' | 'payment'>('provider')
  const [paymentIntent, setPaymentIntent] = useState<any>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  })
  
  // Calculate INR amount for Razorpay (if currency is USD)
  const inrAmount = currency === 'USD' ? convertUSDToINR(amount) : amount

  useEffect(() => {
    if (isOpen) {
      setStep('provider')
      setPaymentIntent(null)
      setSelectedProvider('stripe')
      setLoading(false)
    } else {
      // Cleanup when modal closes
      setStep('provider')
      setPaymentIntent(null)
      setSelectedProvider('stripe')
      setLoading(false)
    }
  }, [isOpen])

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true })
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000)
  }

  const handleProviderSelect = async (provider: PaymentProvider) => {
    setSelectedProvider(provider)
    setLoading(true)

    try {
      // Razorpay requires INR currency for UPI/Net Banking
      // Convert USD amount to INR for Razorpay
      let paymentAmount = amount
      let paymentCurrency = currency
      
      if (provider === 'razorpay' && currency === 'USD') {
        // Convert USD to INR for Razorpay
        paymentAmount = inrAmount
        paymentCurrency = 'INR'
      }

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          billingPeriod,
          provider,
          amount: paymentAmount, // Use converted INR amount for Razorpay
          currency: paymentCurrency, // Use INR for Razorpay
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Extract clean error message without URLs
        const errorMsg = data.error || 'Failed to create payment intent'
        throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Failed to initialize payment')
      }

      setPaymentIntent(data.paymentIntent)
      setStep('payment')
    } catch (error: any) {
      // Clean error message - remove URLs and technical details
      let errorMessage = 'Failed to initialize payment'
      const errorStr = error?.message || error?.toString() || ''
      if (errorStr && !errorStr.includes('http') && !errorStr.includes('fetch') && !errorStr.includes('axios') && !errorStr.includes('api/')) {
        errorMessage = errorStr
      }
      showToast(errorMessage, 'error')
      // Reset state on error
      setSelectedProvider('stripe')
      setStep('provider')
    } finally {
      setLoading(false)
    }
  }

  const handleStripePayment = async () => {
    if (!paymentIntent?.clientSecret) {
      showToast('Payment intent not ready', 'error')
      return
    }

    // Load Stripe.js
    const stripe = (window as any).Stripe?.(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    if (!stripe) {
      showToast('Stripe not loaded. Please refresh the page.', 'error')
      return
    }

    setLoading(true)

    try {
      // Use Stripe's redirect to checkout for better UX
      // This opens Stripe's hosted payment page
      const { error } = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
        payment_method: {
          card: {
            // Stripe will handle card collection
          },
        },
      })

      if (error) {
        // User cancelled or payment failed
        if (error.type === 'card_error') {
          showToast(error.message || 'Card payment failed', 'error')
        } else if (error.type === 'validation_error') {
          showToast(error.message || 'Invalid card details', 'error')
        } else {
          // User likely cancelled
          showToast('Payment cancelled', 'info')
        }
        setLoading(false)
        return
      }

      // Payment succeeded
      showToast('Payment successful!', 'success')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (error: any) {
      // Clean error message - remove URLs and technical details
      let errorMessage = 'Payment was cancelled'
      const errorStr = error?.message || error?.toString() || ''
      if (errorStr && !errorStr.includes('http') && !errorStr.includes('fetch') && !errorStr.includes('axios')) {
        errorMessage = errorStr
      }
      showToast(errorMessage, 'info')
      setLoading(false)
    }
  }

  const handleRazorpayPayment = async () => {
    if (!paymentIntent?.id) {
      showToast('Payment intent not ready', 'error')
      return
    }

    // Load Razorpay
    const Razorpay = (window as any).Razorpay
    if (!Razorpay) {
      showToast('Razorpay not loaded. Please refresh the page.', 'error')
      return
    }

    setLoading(true)

    // Razorpay requires INR currency for UPI and Net Banking
    // Force INR currency for Razorpay checkout
    const razorpayCurrency = 'INR'
    const razorpayAmount = paymentIntent.amount * 100 // Convert to paise

    const options: any = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: razorpayAmount, // Amount in paise (INR smallest unit)
      currency: razorpayCurrency, // Always use INR for Razorpay (required for UPI/Net Banking)
      name: 'Whispering Palms',
      description: `${planType} Plan - ${billingPeriod}`,
      order_id: paymentIntent.id,
      // Explicitly enable UPI and Net Banking (only works with INR currency)
      method: {
        netbanking: true, // Enable Net Banking (INR only)
        upi: true, // Enable UPI (INR only)
        card: true, // Enable Cards
        wallet: true, // Enable Wallets
        emi: false, // Disable EMI
      },
      // Configure payment method display with custom blocks
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Net Banking',
              instruments: [
                {
                  method: 'netbanking',
                },
              ],
            },
            upi: {
              name: 'UPI',
              instruments: [
                {
                  method: 'upi',
                },
              ],
            },
            cards: {
              name: 'Cards',
              instruments: [
                {
                  method: 'card',
                },
              ],
            },
            wallets: {
              name: 'Wallets',
              instruments: [
                {
                  method: 'wallet',
                },
              ],
            },
          },
          // Display order: Net Banking first, then UPI, then Cards, then Wallets
          sequence: ['block.banks', 'block.upi', 'block.cards', 'block.wallets'],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
      handler: async (response: any) => {
        try {
          // Verify payment on backend
          const verifyResponse = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'razorpay',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            }),
          })

          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json().catch(() => ({}))
            throw new Error(errorData.error || 'Payment verification failed')
          }

          showToast('Payment successful!', 'success')
          setTimeout(() => {
            onSuccess?.()
            onClose()
          }, 1500)
        } catch (error: any) {
          // Clean error message - remove URLs and technical details
          let errorMessage = 'Payment verification failed'
          const errorStr = error?.message || error?.toString() || ''
          if (errorStr && !errorStr.includes('http') && !errorStr.includes('fetch') && !errorStr.includes('axios') && !errorStr.includes('api/')) {
            errorMessage = errorStr
          }
          showToast(errorMessage, 'error')
        } finally {
          setLoading(false)
        }
      },
      prefill: {
        email: '', // Get from user profile
        name: '',
      },
      theme: {
        color: '#D4AF37', // Gold color matching app theme
      },
    }

    const razorpay = new Razorpay(options)
    
    // Handle payment cancellation
    razorpay.on('payment.failed', (response: any) => {
      showToast('Payment failed', 'error')
      setLoading(false)
    })
    
    razorpay.on('payment.cancelled', () => {
      showToast('Payment cancelled', 'info')
      setLoading(false)
    })
    
    razorpay.open()
    
    // If user closes Razorpay modal without payment
    setTimeout(() => {
      if (loading) {
        // Check if payment was actually initiated
        // If still loading after 2 seconds and no handler called, user likely cancelled
      }
    }, 2000)
  }

  const handleBitcoinPayment = () => {
    // Bitcoin payment flow
    showToast('Bitcoin payment will open in a new window', 'info')
    // In production, redirect to BTCPay Server invoice page
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={(e) => {
          // Close modal when clicking backdrop (only if not loading)
          if (!loading && e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <div 
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-gold-50 to-gold-100 border-b border-gold-200 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">
                {step === 'provider' ? t('subscription.choosePayment') : t('subscription.completePayment')}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (loading) {
                    // Ask for confirmation if payment is in progress
                    if (window.confirm('Payment is in progress. Are you sure you want to cancel?')) {
                      setLoading(false)
                      setStep('provider')
                      setPaymentIntent(null)
                      setSelectedProvider('stripe')
                      onClose()
                    }
                  } else {
                    onClose()
                  }
                }}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors z-10 relative cursor-pointer"
                type="button"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'provider' ? (
              <div className="space-y-4">
                <div className="bg-beige-50 rounded-xl p-4 mb-6">
                  <p className="text-text-secondary text-sm mb-2">
                    {t('subscription.plan')}: <span className="font-semibold">{planType}</span>
                  </p>
                  <p className="text-text-secondary text-sm mb-2">
                    {t('subscription.billingPeriod')}: <span className="font-semibold">{billingPeriod}</span>
                  </p>
                  <p className="text-2xl font-bold text-gold-600">
                    {/* Show INR amount - always convert USD to INR for display */}
                    {currency === 'USD' 
                      ? `₹${inrAmount.toFixed(2)}` 
                      : currency === 'INR'
                      ? `₹${amount.toFixed(2)}`
                      : `${currency} ${amount.toFixed(2)}`}
                    {currency === 'USD' && (
                      <span className="text-sm text-text-secondary ml-2 font-normal">
                        (≈ ${amount.toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {t('subscription.selectPaymentMethod')}
                </h3>

                <div className="grid gap-4">
                  {/* Stripe */}
                  <button
                    onClick={() => handleProviderSelect('stripe')}
                    disabled={loading}
                    className="flex items-center gap-4 p-4 border-2 border-beige-300 rounded-xl hover:border-gold-400 hover:bg-gold-50 transition-all disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.654.605 5.933 1.242l1.42-3.829c-1.257-.515-2.445-.899-4.582-.899-3.74 0-6.162 2.003-6.162 4.903 0 2.838 2.052 4.106 3.896 4.838 2.172.806 3.356 1.426 3.356 2.409 0 .98-.84 1.545-2.227 1.545-1.901 0-4.654-.731-6.162-1.545l-1.42 3.829c1.5.605 3.58 1.242 6.162 1.242 3.896 0 6.162-2.003 6.162-4.903 0-2.838-2.052-4.106-3.896-4.838z"/>
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-text-primary">Card Payment</p>
                      <p className="text-sm text-text-secondary">Visa, Mastercard, Amex</p>
                    </div>
                    <svg className="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Razorpay */}
                  <button
                    onClick={() => handleProviderSelect('razorpay')}
                    disabled={loading}
                    className="flex items-center gap-4 p-4 border-2 border-beige-300 rounded-xl hover:border-gold-400 hover:bg-gold-50 transition-all disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">R</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-text-primary">Razorpay</p>
                      <p className="text-sm text-text-secondary">UPI, Cards, Net Banking, Wallets</p>
                    </div>
                    <svg className="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Bitcoin */}
                  <button
                    onClick={() => handleProviderSelect('bitcoin')}
                    disabled={loading}
                    className="flex items-center gap-4 p-4 border-2 border-beige-300 rounded-xl hover:border-gold-400 hover:bg-gold-50 transition-all disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">₿</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-text-primary">Bitcoin</p>
                      <p className="text-sm text-text-secondary">Cryptocurrency payment</p>
                    </div>
                    <svg className="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-text-secondary mb-4">
                    {t('subscription.completingPayment')}...
                  </p>
                  {selectedProvider === 'stripe' && (
                    <button
                      onClick={handleStripePayment}
                      disabled={loading}
                      className="w-full px-6 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-50"
                    >
                      {loading ? t('common.loading') : t('subscription.payNow')}
                    </button>
                  )}
                  {selectedProvider === 'razorpay' && (
                    <button
                      onClick={handleRazorpayPayment}
                      disabled={loading}
                      className="w-full px-6 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-50"
                    >
                      {loading ? t('common.loading') : t('subscription.payNow')}
                    </button>
                  )}
                  {selectedProvider === 'bitcoin' && (
                    <button
                      onClick={handleBitcoinPayment}
                      disabled={loading}
                      className="w-full px-6 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-50"
                    >
                      {loading ? t('common.loading') : t('subscription.payNow')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      )}
    </>
  )
}
