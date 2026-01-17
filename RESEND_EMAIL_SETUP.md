# Resend Email Setup Guide

## Quick Setup

### 1. Install Resend (Already Done)
```bash
npm install resend
```

### 2. Get Resend API Key

1. Sign up at https://resend.com (free tier available)
2. Go to **API Keys** section
3. Create a new API key
4. Copy the key (starts with `re_`)

### 3. Configure Domain (Required for Production)

1. Go to **Domains** in Resend dashboard
2. Add your domain (e.g., `yourdomain.com`)
3. Add DNS records as instructed
4. Verify domain

**For Testing:**
- Resend provides a test domain: `onboarding@resend.dev`
- You can use this for testing without domain verification

### 4. Environment Variables

Add to `.env.local`:

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
# OR for testing:
# EMAIL_FROM=onboarding@resend.dev

# Test Mode (for quick email testing)
# Set to 'true' to send emails immediately (Basic and Flame plans)
# Set to 'false' or remove to use production timing (24h for Basic, 1h for others)
EMAIL_TEST_MODE=true

# App URL (for audio file links in emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production: NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Company Assets
COMPANY_LOGO_URL=https://yourdomain.com/logo.png
ASTROLOGER_AVATAR_URL=https://yourdomain.com/avatar.png
```

### 5. Test Email Sending

**Option 1: Manual Test**
```bash
# Submit a question via UI
# Then trigger email sending:
curl -X POST http://localhost:3000/api/email/send
```

**Option 2: Test Mode**
With `EMAIL_TEST_MODE=true`:
- Basic plan emails send immediately (instead of 24h)
- Flame plan emails send immediately (instead of 1h)
- Perfect for testing email templates

### 6. Production Setup

**Remove Test Mode:**
```env
# Remove this line or set to false
EMAIL_TEST_MODE=false
```

**Set Up Cron Job:**
```bash
# Run every 5 minutes to check for due emails
*/5 * * * * curl -X POST https://yourdomain.com/api/email/send
```

## Email Templates

### Basic & Spark Plans
- Professional written answer
- Company logo
- Personalized greeting
- Question and answer sections
- Traditional closing

### Flame & SuperFlame Plans
- Voice narration with avatar
- "Listen to Your Personal Reading" section
- Audio player embedded
- Download link for audio file
- No full written answer (voice only)

## Features

✅ **Professional Design** - Astrology-themed, elegant templates
✅ **No AI Mentions** - All content feels human-written
✅ **Responsive** - Works on all email clients
✅ **Test Mode** - Quick testing without delays
✅ **Easy Removal** - Test mode can be disabled with one env var

## Troubleshooting

### Issue: "RESEND_API_KEY is not configured"
**Solution:** Add `RESEND_API_KEY` to `.env.local` and restart server

### Issue: "EMAIL_FROM is not configured"
**Solution:** Add `EMAIL_FROM` to `.env.local`

### Issue: "Domain not verified"
**Solution:** 
- For testing: Use `onboarding@resend.dev`
- For production: Verify your domain in Resend dashboard

### Issue: Emails not sending
**Solution:**
1. Check Resend dashboard for error logs
2. Verify API key is correct
3. Check domain verification status
4. Test with `onboarding@resend.dev` first

## Test Mode Details

**When `EMAIL_TEST_MODE=true`:**
- ✅ Basic plan: Sends immediately (0 hours) instead of 24 hours
- ✅ Flame/SuperFlame: Sends immediately (0 hours) instead of 1 hour
- ✅ Spark: Sends immediately (0 hours) instead of 1 hour

**When `EMAIL_TEST_MODE=false` or not set:**
- ✅ Basic plan: Sends after 24 hours
- ✅ Spark: Sends after 1 hour
- ✅ Flame/SuperFlame: Sends after 1 hour

**To Remove Test Mode:**
Simply remove `EMAIL_TEST_MODE` from `.env.local` or set it to `false`

## Production Checklist

- [ ] Domain verified in Resend
- [ ] `EMAIL_FROM` uses verified domain
- [ ] `EMAIL_TEST_MODE=false` or removed
- [ ] Cron job set up for email delivery
- [ ] Company logo URL configured
- [ ] Astrologer avatar URL configured
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Test email delivery end-to-end

## Resend Free Tier Limits

- 3,000 emails/month
- 100 emails/day
- Perfect for PoC and testing

## Next Steps

1. **Set up Resend account** and get API key
2. **Add environment variables** to `.env.local`
3. **Test with test mode** (`EMAIL_TEST_MODE=true`)
4. **Verify domain** for production
5. **Disable test mode** when ready for production

---

**Email service is now fully configured with Resend!** 📧✨
