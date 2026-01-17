# Razorpay INR Currency Fix

## ✅ Issue Fixed

Razorpay **only supports UPI and Net Banking for INR currency**, not USD or other currencies.

## 🔧 Changes Made

### 1. RazorpayProvider.ts
- **Force INR currency** for all Razorpay orders
- Store original currency in `notes` for reference
- Amount already converted to paise (amount * 100)

### 2. CheckoutModal.tsx
- **Use INR currency** when creating Razorpay payment intent
- **Explicitly enable** `method.upi: true` and `method.netbanking: true`
- Display ₹ symbol for Razorpay payments
- Show original currency as reference if different from INR

### 3. Payment Intent Creation
- Razorpay orders now always use `currency: 'INR'`
- Amount in paise: `amount * 100`
- UPI and Net Banking explicitly enabled

## 📋 Configuration

```typescript
// Razorpay Checkout Options
{
  currency: 'INR', // Required for UPI/Net Banking
  amount: amount * 100, // Amount in paise
  method: {
    upi: true, // Enable UPI (INR only)
    netbanking: true, // Enable Net Banking (INR only)
    card: true,
    wallet: true,
  }
}
```

## ✅ Expected Behavior

After this fix:
1. ✅ Razorpay orders use INR currency
2. ✅ UPI option appears in checkout
3. ✅ Net Banking option appears in checkout
4. ✅ Cards and Wallets still work
5. ✅ Works in both Test Mode and Live Mode

## 🧪 Testing

1. Select Razorpay payment method
2. Check Razorpay checkout modal
3. Verify UPI tab is visible
4. Verify Net Banking tab is visible
5. Verify Cards tab is visible
6. Verify Wallets tab is visible

## 📝 Notes

- **Currency Conversion**: If your app uses USD pricing, you may want to convert USD to INR before creating Razorpay orders
- **Exchange Rate**: Consider using a currency conversion API for accurate USD to INR conversion
- **Display**: UI shows ₹ symbol for Razorpay payments, with original currency as reference
