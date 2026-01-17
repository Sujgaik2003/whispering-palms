/**
 * Bitcoin Payment Provider Implementation
 * Uses BTCPay Server or similar Bitcoin payment processor
 */

import crypto from 'crypto'
import { PaymentProviderInterface, PaymentIntent, Subscription, CreatePaymentIntentParams, CreateSubscriptionParams, WebhookEvent, PaymentStatus, SubscriptionStatus, PlanType, BillingPeriod } from '../types'

export class BitcoinProvider implements PaymentProviderInterface {
  private apiUrl: string
  private apiKey: string

  constructor() {
    this.apiUrl = process.env.BITCOIN_API_URL || ''
    this.apiKey = process.env.BITCOIN_API_KEY || ''

    if (!this.apiUrl || !this.apiKey) {
      throw new Error('BITCOIN_API_URL and BITCOIN_API_KEY must be configured')
    }
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    const { userId, amount, currency, planType, billingPeriod, metadata } = params

    // Convert amount to BTC (assuming USD input)
    const btcAmount = await this.convertToBTC(amount, currency)

    // Create invoice via BTCPay Server or similar
    const invoice = await this.createInvoice({
      amount: btcAmount,
      currency: 'BTC',
      metadata: {
        userId,
        planType,
        billingPeriod,
        ...metadata,
      },
    })

    return {
      id: invoice.id,
      provider: 'bitcoin',
      amount: btcAmount,
      currency: 'BTC',
      status: this.normalizePaymentStatus(invoice.status),
      metadata: invoice.metadata as Record<string, string>,
    }
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    // Bitcoin subscriptions are typically handled as recurring invoices
    // For simplicity, we'll create a payment intent that needs to be renewed manually
    // or implement via BTCPay Server's subscription feature if available
    
    const { userId, planType, billingPeriod, metadata } = params

    // Create initial payment
    const paymentIntent = await this.createPaymentIntent({
      userId,
      amount: this.getPlanAmount(planType, billingPeriod),
      currency: 'USD',
      planType,
      billingPeriod,
      metadata,
    })

    // For Bitcoin, we'll create a "subscription" record that tracks manual renewals
    // In production, integrate with BTCPay Server subscriptions if available
    return {
      id: `btc_sub_${Date.now()}`,
      userId,
      planType,
      billingPeriod,
      status: 'active',
      provider: 'bitcoin',
      providerSubscriptionId: paymentIntent.id,
      providerCustomerId: userId, // Use userId as customer ID for Bitcoin
      startDate: new Date(),
      endDate: this.calculateEndDate(billingPeriod),
      nextBillingDate: this.calculateEndDate(billingPeriod),
      metadata: {
        paymentIntentId: paymentIntent.id,
        ...metadata,
      },
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription> {
    // Bitcoin subscriptions are typically manual, so we just mark as canceled
    // In production, cancel any recurring invoices in BTCPay Server
    throw new Error('Bitcoin subscription cancellation not yet implemented')
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Pick<Subscription, 'planType' | 'billingPeriod'>>
  ): Promise<Subscription> {
    throw new Error('Bitcoin subscription updates not yet implemented')
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    // Check database for subscription record
    // Bitcoin subscriptions are tracked in our DB, not in external service
    return null
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): boolean {
    const payloadString = typeof payload === 'string' ? payload : payload.toString()
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
    // Handle BTCPay Server webhook events
    // Update payment status, subscription status, etc.
  }

  async getPaymentMethods(customerId: string): Promise<any[]> {
    // Bitcoin doesn't have payment methods like cards
    return []
  }

  normalizeStatus(providerStatus: string): PaymentStatus | SubscriptionStatus {
    return this.normalizePaymentStatus(providerStatus) || this.normalizeSubscriptionStatus(providerStatus)
  }

  private normalizePaymentStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'new': 'pending',
      'paid': 'succeeded',
      'confirmed': 'succeeded',
      'complete': 'succeeded',
      'expired': 'failed',
      'invalid': 'failed',
    }
    return statusMap[status] || 'pending'
  }

  private normalizeSubscriptionStatus(status: string): SubscriptionStatus {
    return 'active' // Bitcoin subscriptions are typically always active until manually canceled
  }

  private async convertToBTC(amount: number, fromCurrency: string): Promise<number> {
    // In production, use a real exchange rate API
    // For now, use a mock conversion (1 USD ≈ 0.000025 BTC)
    if (fromCurrency === 'USD') {
      return amount * 0.000025
    }
    // Add more currency conversions as needed
    return amount * 0.000025
  }

  private async createInvoice(params: {
    amount: number
    currency: string
    metadata: Record<string, string>
  }): Promise<any> {
    // In production, integrate with BTCPay Server API
    // For now, return a mock invoice
    return {
      id: `btc_inv_${Date.now()}`,
      status: 'new',
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
      paymentAddress: this.generateBitcoinAddress(),
      expiryDate: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    }
  }

  private generateBitcoinAddress(): string {
    // In production, generate via BTCPay Server or wallet API
    // This is a mock address
    return `bc1q${crypto.randomBytes(20).toString('hex').substring(0, 40)}`
  }

  private getPlanAmount(planType: PlanType, billingPeriod: BillingPeriod): number {
    const prices: Record<string, number> = {
      'spark_monthly': 10,
      'spark_yearly': 80,
      'flame_monthly': 25,
      'flame_yearly': 200,
      'superflame_monthly': 35,
      'superflame_yearly': 300,
    }
    return prices[`${planType}_${billingPeriod}`] || 0
  }

  private calculateEndDate(billingPeriod: BillingPeriod): Date {
    const date = new Date()
    if (billingPeriod === 'yearly') {
      date.setFullYear(date.getFullYear() + 1)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    return date
  }
}
