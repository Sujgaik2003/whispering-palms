# Gmail SMTP Setup Guide - Testing/PoC Only

## ⚠️ Important Note

**Gmail SMTP is configured for testing and PoC purposes only.** It's suitable for:
- ✅ Low-volume testing (Gmail has daily sending limits)
- ✅ Development and demos
- ✅ Quick email template testing

**For production, use Resend API** after domain verification.

---

## 🚀 Quick Setup

### Step 1: Generate Gmail App Password

1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Go to **App passwords**: https://myaccount.google.com/apppasswords
4. Select app: **Mail**
5. Select device: **Other (Custom name)** → Enter "Whispering Palms"
6. Click **Generate**
7. **Copy the 16-character password** (no spaces)

### Step 2: Add to `.env.local`

```env
# Email Provider Selection
# Options: 'resend' (production) or 'gmail' (testing)
EMAIL_PROVIDER=gmail

# Gmail SMTP Configuration (Testing/PoC only)
GMAIL_USER=ravikm896@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password

# Test Mode (optional - Gmail already sends immediately)
EMAIL_TEST_MODE=true

# App URL (for audio file links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Test

1. Submit a question via UI
2. Trigger email: `POST /api/email/send`
3. Check your email inbox!

---

## 📧 How It Works

### Gmail SMTP Behavior

- ✅ **Sends immediately** - No delivery delay logic
- ✅ **Uses existing HTML templates** - All templates work perfectly
- ✅ **Supports all plan types** - Basic, Spark, Flame, SuperFlame
- ✅ **Includes audio links** - For Flame/SuperFlame plans
- ✅ **Professional formatting** - Same templates as Resend

### Email Templates

All existing templates are reused:
- **Basic/Spark**: Written answer with logo, greeting, question, answer
- **Flame/SuperFlame**: Voice narration with avatar, audio player, download link

---

## 🔄 Switching Between Providers

### Use Gmail SMTP (Testing)
```env
EMAIL_PROVIDER=gmail
GMAIL_USER=ravikm896@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### Use Resend (Production)
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

---

## ⚙️ Configuration Details

### Gmail SMTP Settings

- **Host**: smtp.gmail.com
- **Port**: 587 (TLS)
- **Authentication**: App Password (not regular password)
- **From Address**: Uses GMAIL_USER (ravikm896@gmail.com)
- **Display Name**: "Whispering Palms"

### Gmail Limits

- **Daily sending limit**: ~500 emails/day (for regular Gmail accounts)
- **Rate limit**: ~100 emails/hour
- **Suitable for**: Testing, demos, low-volume PoC

---

## 🧪 Testing Steps

1. **Set up Gmail SMTP** (follow steps above)

2. **Submit a question** via UI:
   - Go to `/chat`
   - Type a question
   - Click Submit

3. **Trigger email delivery**:
   ```javascript
   // Browser console
   fetch('/api/email/send', { method: 'POST' })
     .then(r => r.json())
     .then(console.log)
   ```

4. **Check email inbox** - Should arrive immediately!

5. **Verify email content**:
   - ✅ Logo appears
   - ✅ Greeting with your name
   - ✅ Question section
   - ✅ Answer (or voice player for Flame plan)
   - ✅ Professional footer

---

## 🔍 Troubleshooting

### Issue: "Gmail SMTP not configured"

**Solution:**
1. Check `GMAIL_USER` and `GMAIL_APP_PASSWORD` are in `.env.local`
2. Verify app password is correct (16 characters, no spaces)
3. Restart server

### Issue: "Invalid login credentials"

**Solution:**
1. Make sure you're using **App Password**, not regular password
2. Verify 2-Step Verification is enabled
3. Generate a new app password if needed

### Issue: "Connection timeout"

**Solution:**
1. Check internet connection
2. Verify Gmail account is not locked
3. Try again after a few minutes

### Issue: "Daily sending limit exceeded"

**Solution:**
- Gmail has daily limits (~500 emails/day)
- Wait 24 hours or switch to Resend for higher volume

---

## 📝 Environment Variables Summary

### For Gmail SMTP (Testing)
```env
EMAIL_PROVIDER=gmail
GMAIL_USER=ravikm896@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_TEST_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Resend (Production)
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_TEST_MODE=false
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## ✅ Advantages of Gmail SMTP

- ✅ **No API key needed** - Just Gmail account
- ✅ **No domain verification** - Works immediately
- ✅ **Free** - No cost for testing
- ✅ **Immediate delivery** - Perfect for testing
- ✅ **Full HTML support** - All templates work

## ⚠️ Limitations

- ⚠️ **Daily limits** - ~500 emails/day
- ⚠️ **Rate limits** - ~100 emails/hour
- ⚠️ **Not for production** - Use Resend for production
- ⚠️ **Gmail branding** - Emails show as from Gmail account

---

## 🚀 Production Migration

When ready for production:

1. **Set up Resend account** and verify domain
2. **Change environment variable**:
   ```env
   EMAIL_PROVIDER=resend
   ```
3. **Add Resend credentials**
4. **Remove Gmail SMTP config** (optional)

No code changes needed - just switch the provider!

---

**Gmail SMTP is now configured for testing!** 📧✨

Perfect for quick testing and demos without waiting for domain verification.
