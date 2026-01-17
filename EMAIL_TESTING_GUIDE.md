# Email Testing Guide - Step by Step

## 🎯 Quick Start with Gmail SMTP

### Step 1: Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with: **ravikm896@gmail.com**
3. Select **Mail** and **Other (Custom name)**
4. Enter name: "Whispering Palms"
5. Click **Generate**
6. **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)

### Step 2: Update `.env.local`

Add these lines:
```env
# Use Gmail SMTP for testing
EMAIL_PROVIDER=gmail
GMAIL_USER=ravikm896@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop

# Test mode (sends immediately)
EMAIL_TEST_MODE=true

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** Remove spaces from app password when pasting!

### Step 3: Restart Server

```powershell
# Stop server (Ctrl+C)
npm run dev
```

### Step 4: Test via UI

1. **Open browser**: `http://localhost:3000`
2. **Login** to your account
3. **Go to**: `/chat` or click "Ask Questions"
4. **Submit a question**: 
   - Type: "What does my palm reading say about my career?"
   - Click "Submit"
5. **Wait for answer** (check terminal logs)
6. **Trigger email** (browser console - F12):
   ```javascript
   fetch('/api/email/send', { method: 'POST' })
     .then(r => r.json())
     .then(data => {
       console.log(data)
       alert('Sent: ' + data.data.sent + ' email(s)')
     })
   ```
7. **Check email inbox** (ravikm896@gmail.com or your registered email)

---

## ✅ What to Check

### In Terminal Logs:
```
🔍 Environment check:
  Email Provider: Gmail SMTP (Testing)
  GMAIL_USER: ✅ Set
  GMAIL_APP_PASSWORD: ✅ Set
📧 Using Gmail SMTP (Testing mode)
📧 Gmail SMTP: Sending email immediately
✅ Email sent via Gmail SMTP: <message-id>
```

### In Email Inbox:
- ✅ Subject: "Your Personal Reading from Whispering Palms"
- ✅ Logo at top
- ✅ Greeting with your name
- ✅ Your question displayed
- ✅ Answer (or voice player for Flame plan)
- ✅ Professional footer

---

## 🔄 Switch Back to Resend

When ready to use Resend:

1. **Update `.env.local`**:
   ```env
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=onboarding@resend.dev
   ```

2. **Restart server**

3. **Test again** - Should use Resend now

---

## 🐛 Troubleshooting

### "Gmail SMTP not configured"
- Check `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env.local`
- Restart server after adding

### "Invalid login"
- Use **App Password**, not regular password
- Verify 2-Step Verification is enabled
- Generate new app password

### Email not arriving
- Check spam folder
- Verify email address in database
- Check terminal for error messages

---

**That's it!** Gmail SMTP is now ready for testing! 📧
