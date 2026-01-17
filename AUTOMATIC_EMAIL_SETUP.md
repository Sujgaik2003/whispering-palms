# Automatic Email Scheduler Setup

## ✅ Complete! Email Scheduler is Now Automatic

Ab aapko manually kuch bhi call karne ki zaroorat nahi hai. Email scheduler automatically har minute check karega aur emails send karega.

## 🚀 How to Start (Local Development)

### Option 1: Automatic Script (Recommended)
```bash
# Windows PowerShell
.\start-dev-with-scheduler.ps1

# Linux/Mac
chmod +x start-dev-with-scheduler.sh
./start-dev-with-scheduler.sh
```

### Option 2: npm Script
```bash
npm run dev:with-scheduler
```

Yeh dono processes ek saath start karega:
- Next.js dev server
- Email scheduler (har minute automatically check karega)

### Option 3: Manual (Two Terminals)
**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npm run email:scheduler
```

## 📧 How It Works

1. **Question Submit**: User question submit karta hai
2. **Email Scheduled**: Email `delivery_time` ke saath schedule hoti hai:
   - Basic: 24 hours
   - Spark: 1 hour
   - Flame/SuperFlame: 5 minutes
3. **Automatic Check**: Email scheduler har minute automatically:
   - Pending emails check karta hai
   - Agar `current_time >= delivery_time` ho, email send karta hai
   - Status update karta hai

## 🎯 Testing

### Test 5-Minute Delay (Flame/SuperFlame)
1. `.env.local` mein `EMAIL_TEST_MODE=false` set karo
2. Server restart karo
3. SuperFlame plan se question submit karo
4. **Kuch bhi manually call mat karo** - bas wait karo
5. 5 minutes baad email automatically send ho jayega

### Test 1-Hour Delay (Spark)
1. Spark plan se question submit karo
2. 1 hour wait karo
3. Email automatically send ho jayega

### Test 24-Hour Delay (Basic)
1. Basic plan se question submit karo
2. 24 hours wait karo
3. Email automatically send ho jayega

## 🔧 Production (Vercel)

Production mein `vercel.json` automatically cron job configure karta hai:
- Har minute `/api/email/cron` call hoga
- Koi manual setup ki zaroorat nahi

## 📝 Important Notes

1. **Test Mode**: Agar `EMAIL_TEST_MODE=true` hai, to sab emails immediately send hongi. Production ke liye `false` karo.

2. **Gmail SMTP**: Agar `EMAIL_PROVIDER=gmail` hai, to emails immediately send hongi (testing ke liye).

3. **Logs**: Email scheduler console mein logs dikhayega:
   - Har 5 checks par status log
   - Jab email send ho, to notification

## 🐛 Troubleshooting

### Emails nahi ja rahi?
1. Check karo scheduler chal raha hai: Console mein logs dikhne chahiye
2. Check karo `.env.local` mein `EMAIL_TEST_MODE=false` hai
3. Check karo database mein `email_metadata.delivery_time` sahi set hai
4. Check karo email provider (Resend/Gmail) properly configured hai

### Scheduler start nahi ho raha?
1. Check karo `npm run email:scheduler` manually run karke
2. Check karo server `http://localhost:3000` accessible hai
3. Check karo koi port conflict nahi hai

## ✅ Summary

- ✅ Automatic email sending - koi manual call nahi
- ✅ Har minute check - pending emails automatically send
- ✅ Plan-based delays - Basic (24h), Spark (1h), Flame/SuperFlame (5min)
- ✅ Production ready - Vercel cron automatically configured
- ✅ Local dev ready - Script se ek saath start

**Ab bas question submit karo aur wait karo - email automatically scheduled time par send ho jayega!** 🎉
