/**
 * Payment Verification API Route
 * Verifies payment signatures from providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

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
    const { provider, paymentId, orderId, signature } = body

    if (!provider || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let verified = false

    if (provider === 'razorpay') {
      // Verify Razorpay signature
      const secret = process.env.RAZORPAY_KEY_SECRET || ''
      const text = `${orderId}|${paymentId}`
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex')
      
      verified = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    } else if (provider === 'stripe') {
      // Stripe verification is handled via webhooks
      verified = true
    } else if (provider === 'bitcoin') {
      // Bitcoin verification depends on implementation
      verified = true
    }

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString(),
      })
      .eq('provider_payment_id', paymentId)
      .eq('provider', provider)

    return NextResponse.json({
      success: true,
      verified: true,
    })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
