/**
 * Create Subscription API Route
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
      paymentMethodId,
      provider = 'stripe' as PaymentProvider
    } = body

    if (!planType || !billingPeriod || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields: planType, billingPeriod, paymentMethodId' },
        { status: 400 }
      )
    }

    const paymentService = getPaymentService()

    // Get user profile for metadata
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Create subscription
    const subscription = await paymentService.createSubscription(
      {
        userId: user.id,
        planType,
        billingPeriod,
        paymentMethodId,
        metadata: {
          email: user.email || '',
          name: profile?.name || '',
        },
      },
      provider
    )

    // Store subscription in database
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_type: subscription.planType,
        billing_period: subscription.billingPeriod,
        status: subscription.status,
        provider: subscription.provider,
        provider_subscription_id: subscription.providerSubscriptionId,
        provider_customer_id: subscription.providerCustomerId,
        start_date: subscription.startDate.toISOString(),
        end_date: subscription.endDate?.toISOString(),
        next_billing_date: subscription.nextBillingDate?.toISOString(),
        cancel_at_period_end: subscription.cancelAtPeriodEnd || false,
        metadata: subscription.metadata || {},
      })

    if (subError) {
      console.error('Error storing subscription:', subError)
      // Don't fail the request, subscription was created in payment provider
    }

    // Update user profile with subscription
    await supabase
      .from('user_profiles')
      .update({ 
        subscription_plan: planType,
        current_subscription_id: subscription.id 
      })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        billingPeriod: subscription.billingPeriod,
        status: subscription.status,
        provider: subscription.provider,
        nextBillingDate: subscription.nextBillingDate,
      },
    })
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
