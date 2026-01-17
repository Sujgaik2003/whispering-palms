/**
 * Stripe Payment Provider Implementation
 */

import Stripe from 'stripe'
import { PaymentProviderInterface, PaymentIntent, Subscription, CreatePaymentIntentParams, CreateSubscriptionParams, WebhookEvent, PaymentStatus, SubscriptionStatus } from '../types'

export class StripeProvider implements PaymentProviderInterface {
  private stripe: Stripe

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
    })
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    const { userId, amount, currency, planType, billingPeriod, metadata } = params

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        userId,
        planType,
        billingPeriod,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      id: intent.id,
      provider: 'stripe',
      amount: intent.amount / 100,
      currency: intent.currency.toUpperCase(),
      status: this.normalizePaymentStatus(intent.status),
      clientSecret: intent.client_secret || undefined,
      metadata: intent.metadata as Record<string, string>,
    }
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    const { userId, planType, billingPeriod, paymentMethodId, metadata } = params

    // Get or create customer
    let customerId: string
    const existingCustomers = await this.stripe.customers.list({
      email: metadata?.email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const customer = await this.stripe.customers.create({
        email: metadata?.email,
        metadata: {
          userId,
          ...metadata,
        },
      })
      customerId = customer.id
    }

    // Attach payment method to customer
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Set as default payment method
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    // Get price ID for the plan
    const priceId = this.getPriceId(planType, billingPeriod)

    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId,
        planType,
        billingPeriod,
        ...metadata,
      },
    })

    return {
      id: subscription.id,
      userId,
      planType,
      billingPeriod,
      status: this.normalizeSubscriptionStatus(subscription.status),
      provider: 'stripe',
      providerSubscriptionId: subscription.id,
      providerCustomerId: customerId,
      startDate: new Date(subscription.created * 1000),
      endDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
      nextBillingDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      metadata: subscription.metadata as Record<string, any>,
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription> {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        cancellation_reason: reason || 'user_requested',
      },
    })

    return this.mapStripeSubscription(subscription)
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Pick<Subscription, 'planType' | 'billingPeriod'>>
  ): Promise<Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
    
    const newPriceId = updates.planType && updates.billingPeriod
      ? this.getPriceId(updates.planType, updates.billingPeriod)
      : undefined

    const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
      items: newPriceId ? [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }] : undefined,
    })

    return this.mapStripeSubscription(updatedSubscription)
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
      return this.mapStripeSubscription(subscription)
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null
      }
      throw error
    }
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        secret
      )
      return true
    } catch (error) {
      return false
    }
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
    // This will be handled by the webhook route
    // Implementation depends on event type
  }

  async getPaymentMethods(customerId: string): Promise<any[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })
    return paymentMethods.data
  }

  normalizeStatus(providerStatus: string): PaymentStatus | SubscriptionStatus {
    return this.normalizePaymentStatus(providerStatus) || this.normalizeSubscriptionStatus(providerStatus)
  }

  private normalizePaymentStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'processing',
      'requires_action': 'processing',
      'processing': 'processing',
      'succeeded': 'succeeded',
      'canceled': 'canceled',
      'requires_capture': 'pending',
    }
    return statusMap[status] || 'pending'
  }

  private normalizeSubscriptionStatus(status: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'trialing': 'trial',
      'active': 'active',
      'past_due': 'past_due',
      'canceled': 'canceled',
      'unpaid': 'expired',
      'incomplete': 'incomplete',
      'incomplete_expired': 'incomplete_expired',
    }
    return statusMap[status] || 'active'
  }

  private getPriceId(planType: PlanType, billingPeriod: BillingPeriod): string {
    // These should be configured in Stripe Dashboard and stored in env
    const priceMap: Record<string, string> = {
      'spark_monthly': process.env.STRIPE_PRICE_SPARK_MONTHLY || '',
      'spark_yearly': process.env.STRIPE_PRICE_SPARK_YEARLY || '',
      'flame_monthly': process.env.STRIPE_PRICE_FLAME_MONTHLY || '',
      'flame_yearly': process.env.STRIPE_PRICE_FLAME_YEARLY || '',
      'superflame_monthly': process.env.STRIPE_PRICE_SUPERFLAME_MONTHLY || '',
      'superflame_yearly': process.env.STRIPE_PRICE_SUPERFLAME_YEARLY || '',
    }
    
    const key = `${planType}_${billingPeriod}`
    const priceId = priceMap[key]
    
    if (!priceId) {
      throw new Error(`Price ID not configured for ${planType} ${billingPeriod}`)
    }
    
    return priceId
  }

  private mapStripeSubscription(subscription: Stripe.Subscription): Subscription {
    return {
      id: subscription.id,
      userId: subscription.metadata.userId || '',
      planType: subscription.metadata.planType as PlanType || 'basic',
      billingPeriod: subscription.metadata.billingPeriod as BillingPeriod || 'monthly',
      status: this.normalizeSubscriptionStatus(subscription.status),
      provider: 'stripe',
      providerSubscriptionId: subscription.id,
      providerCustomerId: subscription.customer as string,
      startDate: new Date(subscription.created * 1000),
      endDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
      nextBillingDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      metadata: subscription.metadata as Record<string, any>,
    }
  }
}

import { PlanType, BillingPeriod } from '../types'
