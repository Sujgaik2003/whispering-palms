# Email Test Mode - Quick Reference

## What is Test Mode?

Test mode allows you to send emails **immediately** instead of waiting for scheduled delivery times. This is perfect for testing email templates and delivery without waiting hours or days.

## How to Enable Test Mode

Add to `.env.local`:
```env
EMAIL_TEST_MODE=true
```

## Test Mode Behavior

### With Test Mode ON (`EMAIL_TEST_MODE=true`):
- ✅ **Basic Plan**: Sends immediately (0 hours) instead of 24 hours
- ✅ **Spark Plan**: Sends immediately (0 hours) instead of 1 hour
- ✅ **Flame Plan**: Sends immediately (0 hours) instead of 1 hour
- ✅ **SuperFlame Plan**: Sends immediately (0 hours) instead of 1 hour

### With Test Mode OFF (`EMAIL_TEST_MODE=false` or not set):
- ✅ **Basic Plan**: Sends after 24 hours
- ✅ **Spark Plan**: Sends after 1 hour
- ✅ **Flame Plan**: Sends after 1 hour
- ✅ **SuperFlame Plan**: Sends after 1 hour

## How to Use

1. **Enable test mode:**
   ```env
   EMAIL_TEST_MODE=true
   ```

2. **Submit a question** via the UI

3. **Trigger email delivery:**
   ```bash
   curl -X POST http://localhost:3000/api/email/send
   ```
   Or wait for the scheduled cron job (if configured)

4. **Check your email** - should arrive immediately!

## How to Disable Test Mode

**Option 1:** Remove the variable
```env
# Remove this line:
# EMAIL_TEST_MODE=true
```

**Option 2:** Set to false
```env
EMAIL_TEST_MODE=false
```

**Option 3:** Comment it out
```env
# EMAIL_TEST_MODE=true
```

## Important Notes

⚠️ **Test mode is for development/testing only!**

- Always disable test mode before production deployment
- Test mode bypasses scheduled delivery times
- All emails will be sent immediately when triggered
- Perfect for verifying email templates and formatting

## Production Checklist

Before deploying to production:
- [ ] Remove `EMAIL_TEST_MODE=true` from `.env.local`
- [ ] Or set `EMAIL_TEST_MODE=false`
- [ ] Verify email delivery timing works correctly
- [ ] Test with actual delivery delays

---

**Test mode makes email testing fast and easy!** 🚀
