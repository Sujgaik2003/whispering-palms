# Resend Email - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Resend
```bash
npm install resend
```

### Step 2: Get Resend API Key
1. Go to https://resend.com
2. Sign up (free tier: 3,000 emails/month)
3. Go to **API Keys** → Create new key
4. Copy the key (starts with `re_`)

### Step 3: Add to `.env.local`
```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev  # For testing (no domain verification needed)
# OR for production:
# EMAIL_FROM=noreply@yourdomain.com  # After domain verification

# Test Mode (send emails immediately for testing)
EMAIL_TEST_MODE=true

# App URL (for audio file links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Test
1. Submit a question via UI
2. Trigger email: `POST /api/email/send`
3. Check your email!

## ✅ Done!

Email service is already configured in code. Just add your API key and you're ready to go!

## Test Mode

**Enable:** `EMAIL_TEST_MODE=true`
- Basic plan: Sends immediately (instead of 24h)
- Flame plan: Sends immediately (instead of 1h)

**Disable:** Remove `EMAIL_TEST_MODE` or set to `false`
- Normal timing applies (24h for Basic, 1h for others)

## Production

1. Verify domain in Resend dashboard
2. Use verified domain in `EMAIL_FROM`
3. Remove or disable `EMAIL_TEST_MODE`
4. Set up cron job for email delivery

---

**That's it!** 📧✨
