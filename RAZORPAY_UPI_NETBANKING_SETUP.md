# Razorpay UPI & Net Banking Setup Guide

## ✅ Code Configuration (Already Done)

Code mein UPI aur Net Banking enable kar diya gaya hai:
- `method.netbanking: 1` ✅
- `method.upi: 1` ✅
- `method.card: 1` ✅
- `method.wallet: 1` ✅

## ⚠️ Important: Razorpay Dashboard Settings

Agar abhi bhi sirf Cards dikh rahe hain, to yeh **Razorpay Dashboard** mein enable karna hoga:

### Step 1: Razorpay Dashboard Login
1. https://dashboard.razorpay.com/ par login karo
2. Apna merchant account select karo

### Step 2: Payment Methods Enable Karo
1. **Settings** → **Payment Methods** par jao
2. Wahan check karo:
   - ✅ **Net Banking** enabled hai?
   - ✅ **UPI** enabled hai?
   - ✅ **Wallets** enabled hai?

Agar disabled hai, to enable karo.

### Step 3: KYC Status Check
1. **Settings** → **Account & Settings** → **KYC Status** check karo
2. Agar KYC **pending** hai, to complete karo
3. KYC complete hone ke baad hi UPI/Net Banking available hoga

### Step 4: Test Mode vs Live Mode
- **Test Mode**: Kuch payment methods limited ho sakte hain
- **Live Mode**: Sabhi payment methods available hote hain

## 🔍 Troubleshooting

### Issue: Sirf Cards Dikh Raha Hai

**Possible Causes:**
1. ❌ Razorpay Dashboard mein UPI/Net Banking disabled hai
2. ❌ KYC pending hai
3. ❌ Test mode mein limited methods available hain
4. ❌ Account approval pending hai

**Solutions:**
1. Razorpay Dashboard → Settings → Payment Methods → Enable UPI & Net Banking
2. KYC complete karo
3. Live mode use karo (production)
4. Razorpay support se contact karo agar approval chahiye

### Issue: UPI/Net Banking Options Nahi Dikhte

**Check:**
1. Browser console mein koi error hai?
2. Razorpay Checkout modal properly load ho raha hai?
3. Network tab mein Razorpay API calls successful hain?

## 📝 Code Reference

Current configuration in `CheckoutModal.tsx`:

```typescript
method: {
  netbanking: 1, // Enable Net Banking
  upi: 1, // Enable UPI
  card: 1, // Enable Cards
  wallet: 1, // Enable Wallets
  emi: 0, // Disable EMI
}
```

## ✅ Verification Steps

1. Razorpay Dashboard check karo - UPI/Net Banking enabled hain?
2. KYC status check karo - Complete hai?
3. Test payment karo - UPI/Net Banking options dikhte hain?
4. Browser console check karo - Koi errors hain?

## 🆘 Support

Agar abhi bhi issue hai:
1. Razorpay Dashboard settings verify karo
2. Razorpay Support se contact karo: support@razorpay.com
3. Razorpay Documentation: https://razorpay.com/docs/payments/
