# Email Cron Setup Guide

## Overview
Emails are scheduled based on subscription plans:
- **Basic Plan**: 24 hours
- **Spark Plan**: 1 hour  
- **Flame Plan**: 5 minutes
- **SuperFlame Plan**: 5 minutes

## Production (Vercel)
The cron job is automatically configured in `vercel.json` to run every minute:
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

This will automatically check and send emails when their delivery time arrives.

## Local Development

### Option 1: Manual Testing
Call the cron endpoint manually:
```bash
# In browser or using curl
curl http://localhost:3000/api/email/cron
```

Or use the npm script:
```bash
npm run email:cron
```

### Option 2: Continuous Testing
Run the test script in watch mode:
```bash
# Edit scripts/email-cron-test.ts and uncomment the setInterval line
# Then run:
tsx scripts/email-cron-test.ts
```

### Option 3: Test Mode (Immediate Delivery)
Set in `.env.local`:
```
EMAIL_TEST_MODE=true
```
This will send all emails immediately regardless of plan type.

## How It Works

1. **Question Submission**: When a user submits a question, the answer is generated and email is scheduled with a `delivery_time` based on their plan.

2. **Cron Job**: The `/api/email/cron` endpoint runs every minute and:
   - Fetches all pending emails from the database
   - Checks if `current_time >= delivery_time`
   - Sends emails that are due
   - Updates email status to 'sent'

3. **Delivery Times**:
   - Basic: `delivery_time = now + 24 hours`
   - Spark: `delivery_time = now + 1 hour`
   - Flame/SuperFlame: `delivery_time = now + 5 minutes`

## Testing Different Plans

### Test Basic Plan (24 hours)
1. Switch to Basic plan
2. Submit a question
3. Check email_metadata in database - delivery_time should be 24 hours from now
4. Wait 24 hours OR manually adjust delivery_time in database to test

### Test Spark Plan (1 hour)
1. Switch to Spark plan
2. Submit a question
3. Check email_metadata - delivery_time should be 1 hour from now
4. Wait 1 hour OR manually adjust delivery_time to test

### Test Flame/SuperFlame Plan (5 minutes)
1. Switch to Flame or SuperFlame plan
2. Submit a question
3. Check email_metadata - delivery_time should be 5 minutes from now
4. Wait 5 minutes OR call `/api/email/cron` after 5 minutes

## Troubleshooting

### Emails not sending?
1. Check if cron is running: Call `/api/email/cron` manually
2. Check database: Verify `email_metadata.delivery_time` is set correctly
3. Check logs: Look for console output showing email status
4. Verify email provider: Ensure RESEND_API_KEY or GMAIL credentials are set

### Test Mode
If `EMAIL_TEST_MODE=true`, all emails send immediately regardless of plan. Disable this for production testing.

### Gmail SMTP
If using Gmail SMTP (`EMAIL_PROVIDER=gmail`), emails send immediately for testing purposes.
