# Payment Integration Guide

## Overview

This application integrates payment processing with three providers:
- **Stripe** - For card payments (Visa, Mastercard, Amex)
- **Razorpay** - For Indian payments (UPI, Cards, Netbanking)
- **Bitcoin** - For cryptocurrency payments

## Architecture

### Unified Payment Service

The payment system uses a unified `PaymentService` abstraction that supports multiple providers through a common interface. This makes it easy to:
- Switch between providers
- Add new providers
- Normalize payment statuses across providers
- Handle webhooks consistently

### File Structure

```
lib/services/payment/
├── types.ts                    # Type definitions
├── PaymentService.ts           # Main service abstraction
└── providers/
    ├── StripeProvider.ts      # Stripe implementation
    ├── RazorpayProvider.ts     # Razorpay implementation
    └── BitcoinProvider.ts      # Bitcoin implementation

app/api/payments/
├── create-intent/route.ts      # Create payment intent
├── create-subscription/route.ts # Create subscription
├── verify/route.ts             # Verify payment
└── webhook/
    ├── stripe/route.ts        # Stripe webhooks
    └── razorpay/route.ts      # Razorpay webhooks

app/components/
└── CheckoutModal.tsx          # Checkout UI component
```

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SPARK_MONTHLY=price_...
STRIPE_PRICE_SPARK_YEARLY=price_...
STRIPE_PRICE_FLAME_MONTHLY=price_...
STRIPE_PRICE_FLAME_YEARLY=price_...
STRIPE_PRICE_SUPERFLAME_MONTHLY=price_...
STRIPE_PRICE_SUPERFLAME_YEARLY=price_...

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_WEBHOOK_SECRET=...

# Bitcoin (optional)
BITCOIN_ENABLED=true
BITCOIN_API_URL=https://...
BITCOIN_API_KEY=...
BITCOIN_WEBHOOK_SECRET=...
```

### 2. Database Setup

Run the migration to create payment tables:

```sql
-- Run migrations/create_payments_schema.sql in Supabase SQL Editor
```

### 3. Install Dependencies

```bash
npm install stripe razorpay
```

### 4. Stripe Setup

1. Create a Stripe account
2. Get API keys from Dashboard
3. Create products and prices for each plan
4. Set up webhook endpoint: `https://your-domain.com/api/payments/webhook/stripe`
5. Add webhook secret to environment variables

### 5. Razorpay Setup

1. Create a Razorpay account
2. Get API keys from Dashboard
3. Set up webhook endpoint: `https://your-domain.com/api/payments/webhook/razorpay`
4. Add webhook secret to environment variables

## Usage

### Creating a Payment Intent

```typescript
const response = await fetch('/api/payments/create-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planType: 'flame',
    billingPeriod: 'monthly',
    provider: 'stripe', // or 'razorpay', 'bitcoin'
    amount: 25,
    currency: 'USD',
  }),
})
```

### Creating a Subscription

```typescript
const response = await fetch('/api/payments/create-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planType: 'flame',
    billingPeriod: 'monthly',
    paymentMethodId: 'pm_...', // Stripe payment method ID
    provider: 'stripe',
  }),
})
```

### Using Checkout Modal

```tsx
import CheckoutModal from '@/app/components/CheckoutModal'

<CheckoutModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  planType="flame"
  billingPeriod="monthly"
  amount={25}
  currency="USD"
  onSuccess={() => {
    // Handle successful payment
  }}
/>
```

## Webhooks

### Stripe Webhook

Endpoint: `/api/payments/webhook/stripe`

Events handled:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Razorpay Webhook

Endpoint: `/api/payments/webhook/razorpay`

Events handled:
- `payment.captured`
- `payment.failed`
- `subscription.created`
- `subscription.activated`
- `subscription.charged`
- `subscription.cancelled`

## Database Schema

### Tables

- `transactions` - Payment transaction records
- `subscriptions` - Subscription records
- `payment_methods` - Stored payment methods
- `webhook_events` - Webhook event log

## Security

1. **Webhook Verification**: All webhooks are verified using provider signatures
2. **RLS Policies**: Row-level security ensures users can only see their own data
3. **Idempotency**: Webhook events are logged to prevent duplicate processing
4. **Status Normalization**: Provider-specific statuses are normalized to standard values

## Testing

### Stripe Test Mode

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

### Razorpay Test Mode

Use Razorpay test credentials from dashboard.

## Production Checklist

- [ ] Set up production API keys
- [ ] Configure webhook endpoints
- [ ] Test all payment flows
- [ ] Set up monitoring and alerts
- [ ] Configure refund policies
- [ ] Set up customer support for payment issues
- [ ] Test subscription renewals
- [ ] Test plan upgrades/downgrades
- [ ] Test cancellations

## Support

For issues or questions:
1. Check webhook event logs in database
2. Review transaction records
3. Check provider dashboards for payment status
4. Review application logs
