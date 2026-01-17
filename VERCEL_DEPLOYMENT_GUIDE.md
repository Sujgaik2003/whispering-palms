# Vercel Deployment Guide - Whispering Palms

## 🚀 Quick Start

This guide will help you deploy Whispering Palms to Vercel with automatic CI/CD from GitHub.

## 📋 Prerequisites

1. **GitHub Account** - Code repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Supabase Project** - Database and storage
4. **Payment Gateway Accounts** (Optional):
   - Stripe account
   - Razorpay account
   - Bitcoin payment provider (if using)

---

## 🌿 Branch Strategy

- **`main`** → Production deployment (auto-deploys to production)
- **`whispering-palms-dev`** → Development branch (for testing)

---

## 📦 Step 1: Push Code to GitHub

### Initial Push (Already Done)

```bash
# Current branch: main
git push -u origin main

# Push dev branch
git checkout whispering-palms-dev
git push -u origin whispering-palms-dev
```

---

## 🔧 Step 2: Connect Vercel to GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository: `Sujgaik2003/whispering-palms`
4. Select the repository and click **"Import"**

---

## ⚙️ Step 3: Configure Vercel Project Settings

### 3.1 Project Settings

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 3.2 Production Branch

- **Production Branch**: `main`
- **Preview Branches**: `whispering-palms-dev` (and all other branches)

---

## 🔐 Step 4: Add Environment Variables

Go to **Project Settings → Environment Variables** and add all the following:

### 🔴 Required (Core)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 📧 Email Configuration (Choose ONE provider)

#### Option A: Resend (Recommended for Production)

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
```

#### Option B: Gmail SMTP (For Testing)

```env
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password
```

**Note**: For Gmail, create an App Password:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password for "Mail"

### 🎨 Email Branding (Optional but Recommended)

```env
COMPANY_LOGO_URL=https://your-domain.com/logo.png
ASTROLOGER_AVATAR_URL=https://your-domain.com/astrologer-avatar.png
```

### 💳 Payment Gateways

#### Stripe (Optional)

```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_PRICE_BASIC_MONTHLY=price_xxxxx
STRIPE_PRICE_BASIC_YEARLY=price_xxxxx
STRIPE_PRICE_SPARK_MONTHLY=price_xxxxx
STRIPE_PRICE_SPARK_YEARLY=price_xxxxx
STRIPE_PRICE_FLAME_MONTHLY=price_xxxxx
STRIPE_PRICE_FLAME_YEARLY=price_xxxxx
STRIPE_PRICE_SUPERFLAME_MONTHLY=price_xxxxx
STRIPE_PRICE_SUPERFLAME_YEARLY=price_xxxxx
```

#### Razorpay (Optional)

```env
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=rzp_live_your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### Bitcoin (Optional)

```env
BITCOIN_ENABLED=true
BITCOIN_API_URL=https://your-bitcoin-api.com
BITCOIN_API_KEY=your_bitcoin_api_key
BITCOIN_WEBHOOK_SECRET=your_webhook_secret
```

### 🤖 AI Services

#### AnythingLLM (Required for Q&A)

```env
ANYTHINGLLM_API_URL=https://your-anythingllm-instance.com
ANYTHINGLLM_API_KEY=your_anythingllm_api_key
```

#### Voice RSS TTS (For Flame/SuperFlame plans)

```env
VOICE_RSS_API_KEY=your_voice_rss_api_key
VOICE_RSS_LANGUAGE=en-us
VOICE_RSS_SPEED=0
VOICE_RSS_VOICE=amy (optional)
```

#### Vision API (For Palm Image Analysis)

```env
# Option 1: Google Cloud Vision (Service Account JSON)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Option 2: Google Cloud Vision (Credentials File Path - not recommended for Vercel)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

#### LLM Service (For Translations/Additional AI)

```env
# Option 1: OpenAI
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini

# Option 2: Ollama (Self-hosted)
USE_OLLAMA=true
OLLAMA_API_URL=http://your-ollama-instance.com:11434
OLLAMA_MODEL=llama3.2
```

### 🌍 Translation Service (Optional)

```env
TRANSLATION_PROVIDER=llm
LIBRETRANSLATE_API_URL=https://your-libretranslate-instance.com
TRANSLATION_API_KEY=your_translation_api_key
```

### 📊 Quota Configuration (Optional - defaults provided)

```env
BASIC_MAX_QUESTIONS=2
SPARK_MAX_QUESTIONS=5
FLAME_MAX_QUESTIONS=8
```

### 🧪 Testing/Development

```env
# Email Testing (set to false in production)
EMAIL_TEST_MODE=false

# Development Mode
NODE_ENV=production
```

---

## 🔄 Step 5: Configure Automatic Deployments

### Production Deployment (main branch)

1. Go to **Project Settings → Git**
2. Ensure **Production Branch** is set to `main`
3. Enable **"Automatically deploy every push to the Production Branch"**

### Preview Deployments (dev branch)

1. Preview deployments are **automatically enabled** for all branches
2. Each push to `whispering-palms-dev` will create a preview deployment
3. Preview URLs are generated automatically

---

## 📅 Step 6: Verify Cron Job Configuration

The project includes a cron job for email delivery. Verify `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/email/cron",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

**This cron job runs every minute** to check and send pending emails.

**Important**: Cron jobs only work on Vercel Pro plan. For Hobby plan, you'll need to:
- Use an external cron service (e.g., cron-job.org) to hit `/api/email/cron` every minute
- Or upgrade to Vercel Pro

---

## 🧪 Step 7: Test Deployment

### 7.1 Initial Deployment

1. After adding environment variables, click **"Deploy"**
2. Wait for build to complete
3. Check deployment logs for errors

### 7.2 Verify Environment Variables

Visit: `https://your-app.vercel.app/api/email/test-env`

This endpoint shows which environment variables are set (without exposing values).

### 7.3 Test Email Delivery

1. Create a test account
2. Subscribe to a plan
3. Ask a question
4. Verify email delivery based on plan:
   - **Flame/SuperFlame**: 5 minutes
   - **Spark**: 1 hour
   - **Basic**: 24 hours

### 7.4 Test Payment Gateways

1. Use test mode keys first
2. Test Stripe/Razorpay checkout
3. Verify webhook endpoints are working

---

## 🔗 Step 8: Configure Webhooks

### Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/payments/webhook/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Razorpay Webhook

1. Go to Razorpay Dashboard → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/payments/webhook/razorpay`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`

---

## 🚨 Step 9: Post-Deployment Checklist

- [ ] All environment variables added
- [ ] Production URL updated in `NEXT_PUBLIC_APP_URL`
- [ ] Supabase RLS policies configured
- [ ] Email provider tested
- [ ] Payment gateways tested (test mode)
- [ ] Cron job running (check Vercel logs)
- [ ] Webhooks configured and tested
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active (automatic with Vercel)

---

## 🔄 Development Workflow

### Working on Dev Branch

```bash
# Switch to dev branch
git checkout whispering-palms-dev

# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Feature: your feature description"
git push origin whispering-palms-dev
```

**Result**: Preview deployment created automatically

### Merging to Production

```bash
# Switch to main
git checkout main

# Merge dev branch
git merge whispering-palms-dev

# Push to main
git push origin main
```

**Result**: Production deployment triggered automatically

---

## 📊 Monitoring & Logs

### View Logs

1. Go to Vercel Dashboard → Your Project
2. Click on a deployment
3. View **"Build Logs"** and **"Runtime Logs"**

### Monitor Cron Jobs

1. Go to **Project Settings → Cron Jobs**
2. View execution history
3. Check for errors

---

## 🐛 Troubleshooting

### Build Fails

- Check build logs for errors
- Verify all required environment variables are set
- Ensure Node.js version is compatible (check `package.json`)

### Email Not Sending

- Verify email provider credentials
- Check `EMAIL_TEST_MODE` is set correctly
- Review cron job logs
- Test email endpoint: `/api/email/test-env`

### Payment Issues

- Verify payment gateway keys are correct
- Check webhook endpoints are accessible
- Review payment logs in Stripe/Razorpay dashboards

### Cron Job Not Running

- Verify Vercel Pro plan (required for cron jobs)
- Check `vercel.json` configuration
- Review cron execution logs

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use Vercel Environment Variables** - Never hardcode secrets
3. **Rotate secrets regularly** - Update API keys periodically
4. **Use service role keys carefully** - Only in server-side code
5. **Enable Supabase RLS** - Row Level Security for database
6. **Use HTTPS** - Automatic with Vercel
7. **Monitor logs** - Check for suspicious activity

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)

---

## ✅ Deployment Complete!

Your Whispering Palms application is now live on Vercel! 🎉

**Production URL**: `https://your-app.vercel.app`  
**Preview URL**: `https://your-app-git-whispering-palms-dev.vercel.app`

---

## 📝 Notes

- **Cron Jobs**: Require Vercel Pro plan. For Hobby plan, use external cron service.
- **Environment Variables**: Add to all environments (Production, Preview, Development)
- **Database Migrations**: Run Supabase migrations separately
- **Storage**: Configure Supabase Storage buckets and policies

---

**Last Updated**: $(date)  
**Maintained By**: Development Team
