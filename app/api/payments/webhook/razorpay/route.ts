/**
 * Razorpay Webhook Handler
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  try {
    // Verify webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    const supabase = await createClient()

    // Log webhook event
    await supabase.from('webhook_events').insert({
      provider: 'razorpay',
      event_id: event.event,
      event_type: event.event,
      payload: event.payload,
      processed: false,
    })

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload, supabase)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.payload, supabase)
        break

      case 'subscription.created':
      case 'subscription.activated':
      case 'subscription.charged':
        await handleSubscriptionUpdated(event.payload, supabase)
        break

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.event}`)
    }

    // Mark event as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('provider', 'razorpay')
      .eq('event_id', event.event)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

async function handlePaymentCaptured(payload: any, supabase: any) {
  const payment = payload.payment.entity

  await supabase
    .from('transactions')
    .update({
      status: 'succeeded',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_payment_id', payment.id)
    .eq('provider', 'razorpay')
}

async function handlePaymentFailed(payload: any, supabase: any) {
  const payment = payload.payment.entity

  await supabase
    .from('transactions')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_payment_id', payment.id)
    .eq('provider', 'razorpay')
}

async function handleSubscriptionUpdated(payload: any, supabase: any) {
  const subscription = payload.subscription.entity
  const userId = subscription.notes?.userId
  if (!userId) return

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_type: subscription.notes?.planType || 'basic',
      billing_period: subscription.notes?.billingPeriod || 'monthly',
      status: normalizeRazorpayStatus(subscription.status),
      provider: 'razorpay',
      provider_subscription_id: subscription.id,
      provider_customer_id: subscription.customer_id || '',
      start_date: new Date(subscription.created_at * 1000).toISOString(),
      end_date: subscription.end_at
        ? new Date(subscription.end_at * 1000).toISOString()
        : null,
      next_billing_date: subscription.current_end
        ? new Date(subscription.current_end * 1000).toISOString()
        : null,
      metadata: subscription.notes || {},
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'provider_subscription_id,provider',
    })
}

async function handleSubscriptionCancelled(payload: any, supabase: any) {
  const subscription = payload.subscription.entity

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', subscription.id)
    .eq('provider', 'razorpay')
}

function normalizeRazorpayStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'created': 'trial',
    'authenticated': 'active',
    'active': 'active',
    'pending': 'active',
    'halted': 'past_due',
    'cancelled': 'canceled',
    'completed': 'expired',
    'expired': 'expired',
  }
  return statusMap[status] || 'active'
}
