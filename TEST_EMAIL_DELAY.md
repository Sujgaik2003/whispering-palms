# Email Delay Testing Guide

## ⚠️ Important: Test Mode Check

Agar aapko **exact delays** test karni hain (5 min, 1 hour, 24 hours), to yeh setting `.env.local` mein **OFF** honi chahiye:

```env
# ❌ Test mode OFF karo (5-minute delay test ke liye)
EMAIL_TEST_MODE=false

# ✅ Gmail provider ab bhi delays respect karega!
# Aap Gmail use kar sakte ho aur delays test kar sakte ho
EMAIL_PROVIDER=gmail
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

## 🔍 Debug Steps

### Step 1: Check Current Settings
`.env.local` file check karo:
- `EMAIL_TEST_MODE` kya hai?
- `EMAIL_PROVIDER` kya hai?

### Step 2: Submit Question
SuperFlame plan se question submit karo.

### Step 3: Check Logs
Console mein yeh logs dikhne chahiye:
```
📅 Scheduling email for superflame plan:
   Current time: 2026-01-14T12:00:00.000Z
   Delivery time: 2026-01-14T12:05:00.000Z
   Delay: 0.083333 hours = 5 minutes = 300 seconds
   Delay in ms: 300000
```

### Step 4: Check Database
Supabase dashboard mein `answers` table check karo:
- `email_metadata->delivery_time` kya hai?
- Current time se 5 minutes baad hona chahiye

### Step 5: Watch Cron Logs
Email scheduler console mein har minute yeh dikhayega:
```
🔍 [CRON] Checking email for superflame plan:
   Scheduled delivery time: 2026-01-14T12:05:00.000Z
   Current time:           2026-01-14T12:01:00.000Z
   Time difference:        4 minutes (240 seconds)
   Is due?                 NO ⏳
⏳ [SKIP] Email for superflame plan will be sent in 4 minutes
```

Jab 5 minutes ho jayenge:
```
🔍 [CRON] Checking email for superflame plan:
   Scheduled delivery time: 2026-01-14T12:05:00.000Z
   Current time:           2026-01-14T12:05:01.000Z
   Time difference:        0 minutes (1 seconds)
   Is due?                 YES ✅
📧 [SEND] Sending email for superflame plan
```

## 🐛 Common Issues

### Issue 1: Email 1 minute mein send ho rahi hai
**Cause**: `EMAIL_TEST_MODE=true` set hai
**Fix**: `.env.local` mein `EMAIL_TEST_MODE=false` karo aur server restart karo

### Issue 2: Email immediately send ho rahi hai
**Cause**: Test mode enabled
**Fix**: `.env.local` mein `EMAIL_TEST_MODE=false` karo aur server restart karo

### Issue 3: Email bilkul nahi ja rahi
**Cause**: Cron job nahi chal raha
**Fix**: 
- Check karo `npm run email:scheduler` chal raha hai
- Ya `npm run dev:with-scheduler` use karo

## ✅ Correct Settings for Testing

```env
# Email Provider - Gmail ya Resend dono delays respect karte hain
EMAIL_PROVIDER=gmail
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Ya Resend:
# EMAIL_PROVIDER=resend
# RESEND_API_KEY=your_key
# EMAIL_FROM=noreply@yourdomain.com

# Test Mode OFF (for real delay testing)
EMAIL_TEST_MODE=false
```

## 📊 Expected Behavior

| Plan | Delay | When Email Sends |
|------|-------|------------------|
| Basic | 24 hours | 24 hours after question submit |
| Spark | 1 hour | 1 hour after question submit |
| Flame | 5 minutes | 5 minutes after question submit |
| SuperFlame | 5 minutes | 5 minutes after question submit |

## 🧪 Quick Test

1. `.env.local` mein `EMAIL_TEST_MODE=false` set karo
2. Server restart karo
3. SuperFlame plan se question submit karo
4. Console logs check karo - delivery_time 5 minutes baad hona chahiye
5. 5 minutes wait karo
6. Email automatically send ho jayega
