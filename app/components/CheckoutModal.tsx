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

  const inrAmount = currency === 'USD' ? convertUSDToINR(amount) : amount

  useEffect(() => {
    if (isOpen) {
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
      console.log(`[Checkout] Initializing ${provider} payment for ${planType}...`)

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          billingPeriod,
          provider,
          amount,
          currency: 'USD',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      setPaymentIntent(data.paymentIntent)
      setStep('payment')

      if (provider === 'stripe') {
        const stripe = (window as any).Stripe?.(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
        if (stripe && data.paymentIntent.id) {
          console.log(`[Checkout] Redirecting to Stripe Session: ${data.paymentIntent.id}`)
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.paymentIntent.id
          })
          if (error) {
            console.error('[Checkout] Stripe Redirect Error:', error)
            showToast(error.message || 'Stripe redirect failed', 'error')
            setLoading(false)
            setStep('provider')
          }
        } else {
          throw new Error('Stripe failed to load or Session ID is missing')
        }
      }
    } catch (error: any) {
      console.error(`[Checkout] ${provider} Init Error:`, error)
      showToast(error.message || 'Payment initialization failed', 'error')
      setLoading(false)
      setStep('provider')
    } finally {
      if (provider !== 'stripe') {
        setLoading(false)
      }
    }
  }

  const handleStripeManualRedirect = async () => {
    if (!paymentIntent?.id) return
    const stripe = (window as any).Stripe?.(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    if (stripe) {
      setLoading(true)
      await stripe.redirectToCheckout({ sessionId: paymentIntent.id })
    }
  }

  const handleRazorpayPayment = async () => {
    if (!paymentIntent?.id) return
    const Razorpay = (window as any).Razorpay
    if (!Razorpay) {
      showToast('Razorpay script not found', 'error')
      return
    }

    setLoading(true)
    const options: any = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: paymentIntent.amount * 100,
      currency: 'INR',
      name: 'Whispering Palms',
      description: `${planType.toUpperCase()} - ${billingPeriod}`,
      order_id: paymentIntent.id,
      handler: async (response: any) => {
        try {
          const verify = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'razorpay',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            }),
          })
          if (verify.ok) {
            showToast('Success!', 'success')
            onSuccess?.()
            onClose()
          } else {
            throw new Error('Verification failed')
          }
        } catch (e) {
          showToast('Payment verification failed', 'error')
        } finally { setLoading(false) }
      },
      prefill: { email: '', name: '' },
      theme: { color: '#D4AF37' },
      modal: { ondismiss: () => setLoading(false) }
    }
    const rzp = new Razorpay(options)
    rzp.open()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={!loading ? onClose : undefined} />

      {/* Modal Card */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">

        {/* Header Section */}
        <div className="p-6 pb-2 sm:p-8 sm:pb-4">
          <button onClick={onClose} disabled={loading} className="absolute right-6 top-6 p-2 rounded-full hover:bg-beige-50 transition-colors disabled:opacity-30">
            <svg className="w-5 h-5 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col items-center text-center mt-2">
            <div className="w-16 h-16 bg-gold-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <svg className="w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">
              {step === 'provider' ? 'Payment Method' : 'Confirming'}
            </h2>
            <div className="flex gap-2 mt-2">
              <span className="bg-beige-100 text-text-tertiary text-[10px] font-black px-2 py-0.5 rounded-md uppercase">{planType}</span>
              <span className="bg-beige-100 text-text-tertiary text-[10px] font-black px-2 py-0.5 rounded-md uppercase">{billingPeriod}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 sm:px-8 sm:py-6 max-h-[70vh] overflow-y-auto">
          {step === 'provider' ? (
            <div className="space-y-6">
              {/* Massive Amount Display */}
              <div className="text-center py-4">
                <div className="text-5xl sm:text-6xl font-black text-gold-600 tracking-tighter tabular-nums">
                  ${amount}<span className="text-lg text-text-tertiary ml-1">USD</span>
                </div>
                <div className="text-sm font-bold text-text-tertiary mt-1">
                  ≈ ₹{inrAmount.toFixed(0)} <span className="font-normal opacity-60">(Estimated)</span>
                </div>
              </div>

              {/* Provider Buttons */}
              <div className="grid gap-3">
                <button
                  onClick={() => handleProviderSelect('stripe')}
                  disabled={loading}
                  className="flex items-center justify-between p-4 bg-white border-2 border-beige-100 rounded-2xl hover:border-gold-400 hover:shadow-lg transition-all active:scale-[0.98] group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#635BFF] text-white rounded-xl flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">S</div>
                    <div className="text-left">
                      <p className="font-bold text-text-primary text-sm sm:text-base">International Card</p>
                      <p className="text-[10px] text-text-tertiary uppercase font-black tracking-wider">Visa, Amex, Apple Pay</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-beige-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" /></svg>
                </button>

                <button
                  onClick={() => handleProviderSelect('razorpay')}
                  disabled={loading}
                  className="flex items-center justify-between p-4 bg-white border-2 border-beige-100 rounded-2xl hover:border-gold-400 hover:shadow-lg transition-all active:scale-[0.98] group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#3395FF] text-white rounded-xl flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">R</div>
                    <div className="text-left">
                      <p className="font-bold text-text-primary text-sm sm:text-base">UPI / NetBanking</p>
                      <p className="text-[10px] text-text-tertiary uppercase font-black tracking-wider">GPay, PhonePe, Cards (INR)</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-beige-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-gold-100 border-t-gold-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gold-600">$</div>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Redirecting Securely</h3>
              <p className="text-sm text-text-secondary px-4">We are opening the payment gateway. Do not close this browser.</p>

              {selectedProvider === 'stripe' && (
                <button onClick={handleStripeManualRedirect} className="mt-8 text-gold-600 font-black text-xs uppercase tracking-widest hover:underline px-4 py-2">
                  Click here if not redirected
                </button>
              )}
              {selectedProvider === 'razorpay' && (
                <button onClick={handleRazorpayPayment} className="mt-8 px-10 py-4 bg-gold-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-gold-200 shadow-xl">
                  Open Razorpay
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-6 bg-beige-50/50 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 opacity-50">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">SSL Secure</span>
          </div>
          <div className="w-px h-3 bg-beige-200" />
          <div className="flex items-center gap-1.5 opacity-50">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Encrypted</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(p => ({ ...p, isVisible: false }))} />
      )}
    </div>
  )
}
