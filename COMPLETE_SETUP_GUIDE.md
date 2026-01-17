# Complete Setup Guide - Whispering Palms

This guide covers all setup steps for the subscription-based astrology PoC with email delivery and voice narration.

## 📋 Table of Contents

1. [Database Setup](#database-setup)
2. [Environment Variables](#environment-variables)
3. [VoiceRSS TTS Setup](#voicerss-tts-setup)
4. [Email Service Configuration](#email-service-configuration)
5. [Backend Setup](#backend-setup)
6. [Testing](#testing)

---

## 1. Database Setup

### Step 1: Run SQL Script

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `database_setup.sql`
4. Click **Run** or press `Ctrl+Enter`

This script will:
- ✅ Update all plan_type columns to support: `basic`, `spark`, `flame`, `superflame`
- ✅ Add `email_metadata` JSONB column to `answers` table
- ✅ Create indexes for better performance
- ✅ Add constraints to validate plan types
- ✅ Create helper functions and views
- ✅ Set up Row Level Security policies

### Step 2: Verify Setup

Run this query to verify:

```sql
-- Check plan types
SELECT 
  'daily_quotas' as table_name,
  plan_type,
  COUNT(*) as count
FROM daily_quotas
GROUP BY plan_type;

-- Check email_metadata column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'answers' AND column_name = 'email_metadata';
```

---

## 2. Environment Variables

Add these to your `.env.local` file:

```env
# ============================================
# Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ============================================
# Quota Configuration
# ============================================
BASIC_MAX_QUESTIONS=2
SPARK_MAX_QUESTIONS=5
FLAME_MAX_QUESTIONS=8
# SuperFlame is unlimited (handled in code)

# ============================================
# VoiceRSS TTS Configuration (for Flame/SuperFlame plans)
# ============================================
# Get your free API key from https://www.voicerss.org/
VOICE_RSS_API_KEY=your_voicerss_api_key_here

# Optional: Language code (default: en-in for Indian English)
# VOICE_RSS_LANGUAGE=en-in

# Optional: Audio format (default: mp3)
# VOICE_RSS_FORMAT=mp3

# Optional: Speech speed -10 to 10 (default: 0)
# VOICE_RSS_SPEED=0

# Optional: Voice name (depends on language)
# VOICE_RSS_VOICE=

# ============================================
# Email Service Configuration
# ============================================
# Choose one email service:

# Option 1: Resend (Recommended - Free tier available)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
# OR for testing without domain verification:
# EMAIL_FROM=onboarding@resend.dev

# Test Mode (for quick email testing)
# Set to 'true' to send emails immediately (Basic and Flame plans)
# Set to 'false' or remove to use production timing (24h for Basic, 1h for others)
EMAIL_TEST_MODE=true

# App URL (for audio file links in emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production: NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Option 2: Nodemailer with SMTP
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
# EMAIL_FROM=your_email@gmail.com

# Option 3: SendGrid
# SENDGRID_API_KEY=your_sendgrid_api_key
# EMAIL_FROM=noreply@yourdomain.com

# ============================================
# Company Assets (for email templates)
# ============================================
# Company logo (optional - shown in email header)
COMPANY_LOGO_URL=https://your-domain.com/logo.png

# Astrologer avatar (optional - for Flame/SuperFlame plans)
# Should be a circular image (200x200px recommended) with emoji or face
# This avatar will be clickable and play the audio when clicked
# Example: Upload an image with emoji hiding mouth to your server/CDN
ASTROLOGER_AVATAR_URL=https://your-domain.com/avatar.png

# ============================================
# AnythingLLM Configuration
# ============================================
ANYTHINGLLM_API_URL=http://localhost:3001
ANYTHINGLLM_API_KEY=your_anythingllm_api_key

# ============================================
# Google Cloud Vision API (for palm analysis)
# ============================================
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json
```

---

## 3. VoiceRSS TTS Setup

VoiceRSS is a cloud-based text-to-speech API that requires **no local setup, no downloads, and no dependencies**. It works by making simple HTTP requests to generate MP3 audio files.

### Step 1: Get VoiceRSS API Key

1. **Sign up at https://www.voicerss.org/**
   - Free tier: 25,000 characters per day
   - Paid plans available for higher limits

2. **Get your API key:**
   - After registration, go to your dashboard
   - Copy your API key (it will look like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

3. **Add to `.env.local`:**
   ```env
   VOICE_RSS_API_KEY=your_voicerss_api_key_here
   ```

### Step 2: Configure Language (Optional)

VoiceRSS supports multiple languages and voices. Default is `en-in` (Indian English).

**Available languages include:**
- `en-in` - Indian English (default)
- `en-us` - US English
- `en-gb` - British English
- `hi-in` - Hindi
- And many more...

**To change language:**
```env
VOICE_RSS_LANGUAGE=en-us
```

### Step 3: Test VoiceRSS

The VoiceRSS API works by generating a URL that returns an MP3 file. You can test it directly in your browser:

```
https://api.voicerss.org/?key=YOUR_API_KEY&hl=en-in&src=Hello, this is a test
```

Replace `YOUR_API_KEY` with your actual API key. This URL will return a playable MP3 file.

**That's it!** No downloads, no installation, no dependencies. VoiceRSS works entirely via HTTP requests.

---

## 4. Email Service Configuration

### Resend Setup (Already Configured)

1. **Install Resend:**
   ```bash
   npm install resend
   ```

2. **Sign up at https://resend.com** (free tier: 3,000 emails/month)

3. **Get API Key:**
   - Go to **API Keys** in Resend dashboard
   - Create new API key
   - Copy the key (starts with `re_`)

4. **Add to `.env.local`:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=noreply@yourdomain.com
   # OR for testing:
   # EMAIL_FROM=onboarding@resend.dev
   
   # Test Mode (for quick testing)
   EMAIL_TEST_MODE=true
   
   # App URL (for audio links)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Domain Verification (Production):**
   - Go to **Domains** in Resend
   - Add your domain
   - Add DNS records
   - Verify domain
   - Use verified domain in `EMAIL_FROM`

**Test Mode:**
- When `EMAIL_TEST_MODE=true`:
  - ✅ Basic plan emails send **immediately** (instead of 24h)
  - ✅ Flame/SuperFlame emails send **immediately** (instead of 1h)
  - Perfect for testing email templates quickly
- To disable: Remove `EMAIL_TEST_MODE` or set to `false`

**Email service is already configured in code!** Just add your API key.

### Option 2: Nodemailer with SMTP

1. Install nodemailer:
   ```bash
   npm install nodemailer
   ```

2. Update `app/api/email/send/route.ts`:
   ```typescript
   import nodemailer from 'nodemailer'
   
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: parseInt(process.env.SMTP_PORT || '587'),
     secure: false,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   })
   
   async function sendEmail(to: string, subject: string, html: string): Promise<void> {
     await transporter.sendMail({
       from: process.env.EMAIL_FROM,
       to,
       subject,
       html,
     })
   }
   ```

### Option 3: SendGrid

1. Sign up at https://sendgrid.com
2. Get your API key
3. Install: `npm install @sendgrid/mail`
4. Update `app/api/email/send/route.ts` accordingly

---

## 5. Backend Setup

### Step 1: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 2: Verify Services

**Check Quota Service:**
- File: `lib/services/quota.ts`
- Supports: `basic`, `spark`, `flame`, `superflame`
- SuperFlame has unlimited questions (999999)

**Check Email Service:**
- File: `lib/services/email.ts`
- Supports all 4 plans
- Flame and SuperFlame get voice narration

**Check Piper TTS:**
- File: `lib/services/piper-tts.ts`
- Automatically checks if Piper is available
- Falls back gracefully if not available

### Step 3: Update API Routes

All API routes have been updated to support all 4 plans:
- ✅ `app/api/questions/route.ts`
- ✅ `app/api/questions/answer/route.ts`
- ✅ `app/api/quota/route.ts`

### Step 4: Set Up Email Delivery

**Option A: Manual Trigger (for testing)**
```bash
curl -X POST http://localhost:3000/api/email/send
```

**Option B: Cron Job**
```bash
# Run every 5 minutes
*/5 * * * * curl -X POST https://your-domain.com/api/email/send
```

**Option C: Vercel Cron (if using Vercel)**
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/email/send",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## 6. Testing

### Test 1: Database Setup

```sql
-- Check all plan types are supported
SELECT DISTINCT plan_type FROM daily_quotas;
SELECT DISTINCT plan_type FROM subscriptions;
SELECT DISTINCT subscription_plan FROM user_profiles;

-- Should return: basic, spark, flame, superflame
```

### Test 2: Quota Service

1. Create a test user
2. Set their plan to `basic` (2 questions/day)
3. Submit 2 questions - should work
4. Submit 3rd question - should fail with quota exhausted
5. Change plan to `superflame`
6. Submit unlimited questions - should work

### Test 3: Email Delivery

1. Submit a question
2. Check `answers.email_metadata` in database
3. Manually trigger email: `POST /api/email/send`
4. Check email inbox

### Test 4: Voice Generation (Flame/SuperFlame)

1. Set user plan to `flame` or `superflame`
2. Submit a question
3. Check `public/audio/` directory for generated `.wav` file
4. Check email metadata for `audio_url`

### Test 5: Subscription Plans UI

1. Navigate to `/subscription`
2. Verify all 4 plans are displayed
3. Test monthly/yearly toggle
4. Verify pricing is correct
5. Test hover animations

---

## 📊 Subscription Plans Summary

| Plan | Monthly | Yearly | Questions/Day | Delivery | Features |
|------|---------|--------|---------------|----------|----------|
| **Basic** | Free | Free | 2 | 24 hours | Written answers |
| **Spark** | $10 | $80 | 5 | 1 hour | Written answers, priority |
| **Flame** | $25 | $200 | 8 | 1 hour | Voice narration, avatar, premium |
| **SuperFlame** | $35 | $280 | Unlimited | 1 hour | All Flame features + unlimited |

---

## 🔧 Troubleshooting

### Issue: "Plan type not supported"

**Solution:** Run the database setup SQL script again.

### Issue: "Piper TTS not available"

**Solution:** 
1. Check Piper binary exists at configured path
2. Check voice model exists
3. Test manually (see Piper TTS Setup)
4. System will continue without voice if Piper is unavailable

### Issue: Emails not sending

**Solution:**
1. Check email service API key is correct
2. Verify `EMAIL_FROM` is set
3. Check email service logs
4. Test email sending manually

### Issue: Quota not resetting

**Solution:**
1. Check `reset_daily_quotas()` function exists
2. Set up cron job to call it daily
3. Or manually reset: `SELECT reset_daily_quotas();`

---

## ✅ Checklist

- [ ] Database SQL script executed successfully
- [ ] All environment variables set
- [ ] Piper TTS installed and tested
- [ ] Email service configured
- [ ] Audio directory created (`public/audio/`)
- [ ] All API routes updated
- [ ] Subscription plans UI accessible
- [ ] Test user created
- [ ] Test question submitted
- [ ] Email delivery tested
- [ ] Voice generation tested (Flame plan)

---

## 🚀 Next Steps

1. **Payment Integration:** Add Stripe/Razorpay for subscription payments
2. **Email Automation:** Set up cron job for automatic email delivery
3. **Audio Storage:** Move audio files to cloud storage (Supabase Storage)
4. **Analytics:** Track subscription conversions
5. **Testing:** Comprehensive end-to-end testing

---

## 📝 Notes

- SuperFlame plan uses `999999` as unlimited quota value
- Email metadata is stored as JSONB for flexibility
- Piper TTS is optional - system works without it
- All plans default to `basic` if not specified
- Quota resets daily at midnight (user's timezone)

---

**Setup Complete!** 🎉

Your subscription-based astrology PoC is now ready to use. All plans are configured, email delivery is set up, and voice narration is available for premium plans.
