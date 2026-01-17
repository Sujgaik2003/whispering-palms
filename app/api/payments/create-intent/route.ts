/**
 * Create Payment Intent API Route
 * Supports Stripe, Razorpay, and Bitcoin
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPaymentService } from '@/lib/services/payment/PaymentService'
import { createClient } from '@/lib/supabase/server'
import { PaymentProvider } from '@/lib/services/payment/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      planType, 
      billingPeriod, 
      provider = 'stripe' as PaymentProvider,
      amount,
      currency = 'USD'
    } = body

    if (!planType || !billingPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields: planType, billingPeriod' },
        { status: 400 }
      )
    }

    // Get plan pricing
    const planPrices: Record<string, Record<string, number>> = {
      spark: { monthly: 10, yearly: 80 },
      flame: { monthly: 25, yearly: 200 },
      superflame: { monthly: 35, yearly: 300 },
    }

    const finalAmount = amount || planPrices[planType]?.[billingPeriod] || 0

    if (finalAmount === 0) {
      return NextResponse.json(
        { error: 'Invalid plan or amount' },
        { status: 400 }
      )
    }

    const paymentService = getPaymentService()

    // Get user email for metadata
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const paymentIntent = await paymentService.createPaymentIntent(
      {
        userId: user.id,
        amount: finalAmount,
        currency,
        planType,
        billingPeriod,
        metadata: {
          email: user.email || '',
          name: profile?.name || '',
        },
      },
      provider
    )

    // Store transaction in database
    const { error: dbError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'subscription',
        amount: finalAmount,
        currency,
        provider,
        provider_payment_id: paymentIntent.id,
        status: paymentIntent.status,
        metadata: {
          planType,
          billingPeriod,
          ...paymentIntent.metadata,
        },
      })

    if (dbError) {
      console.error('Error storing transaction:', dbError)
    }

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
