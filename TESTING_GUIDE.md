# Complete Testing Guide - Whispering Palms

## 🧪 Testing Checklist

### Step 1: Docker Containers Status ✅

```powershell
# Check if containers are running
docker ps

# Expected output:
# - qdrant: Up (ports 6333, 6334)
# - anythingllm: Up (port 3001)

# Check logs for errors
docker logs anythingllm --tail 50
docker logs qdrant --tail 50
```

### Step 2: AnythingLLM Health Check ✅

```powershell
# Test AnythingLLM API
curl http://localhost:3001/api/v1/system/health

# Or in browser:
# http://localhost:3001
```

**Expected:** Should return health status or show AnythingLLM dashboard

### Step 3: Qdrant Health Check ✅

```powershell
# Test Qdrant API
curl http://localhost:6333/health

# Or in browser:
# http://localhost:6333/dashboard
```

**Expected:** Should return `{"status":"ok"}` or show Qdrant dashboard

### Step 4: Application Test Flow

#### 4.1: Authentication Test
- [ ] Register new user
- [ ] Login
- [ ] Access dashboard

#### 4.2: Profile Setup Test
- [ ] Complete onboarding
- [ ] Upload birth details
- [ ] Upload palm images (right & left)
- [ ] Verify palm matching status

#### 4.3: AnythingLLM Workspace Test
- [ ] Check if workspace created automatically on registration
- [ ] Verify workspace in AnythingLLM dashboard
- [ ] Test context sync (profile → AnythingLLM document)

#### 4.4: Q&A System Test
- [ ] Submit question in chat
- [ ] Verify quota decrement
- [ ] Check answer generation
- [ ] Verify answer in database

#### 4.5: Translation Test
- [ ] Submit question in Hindi/other language
- [ ] Verify language detection
- [ ] Check answer translation

#### 4.6: Quota System Test
- [ ] Check quota display in dashboard
- [ ] Check quota display in chat
- [ ] Submit questions until quota exhausted
- [ ] Verify quota validation error

---

## 🔍 Detailed Test Steps

### Test 1: API Endpoints Test

```powershell
# 1. Test Authentication
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# 2. Test Quota API (after login)
curl http://localhost:3000/api/quota -H "Cookie: your-session-cookie"

# 3. Test Questions API
curl -X POST http://localhost:3000/api/questions -H "Content-Type: application/json" -H "Cookie: your-session-cookie" -d '{"text":"What is my future?","category":"general"}'
```

### Test 2: Browser Testing

1. **Open Application:**
   - Navigate to `http://localhost:3000`
   - Register/Login

2. **Dashboard:**
   - Check quota card displays
   - Check palm matching status
   - Verify all links work

3. **Chat Page:**
   - Open `/chat`
   - Check quota display
   - Submit a question
   - Verify answer appears
   - Check quota decrements

4. **AnythingLLM Integration:**
   - Check browser console for errors
   - Verify workspace creation
   - Test multiple questions

---

## 🐛 Common Issues & Solutions

### Issue 1: AnythingLLM Not Responding
**Symptoms:** 503 errors, connection refused

**Solutions:**
```powershell
# Check container status
docker ps | Select-String anythingllm

# Check logs
docker logs anythingllm --tail 100

# Restart container
docker restart anythingllm

# Check if port 3001 is accessible
curl http://localhost:3001/api/v1/system/health
```

### Issue 2: Qdrant Connection Failed
**Symptoms:** Vector DB errors

**Solutions:**
```powershell
# Check Qdrant status
docker ps | Select-String qdrant

# Test Qdrant API
curl http://localhost:6333/health

# Restart Qdrant
docker restart qdrant
```

### Issue 3: Quota Not Working
**Symptoms:** Quota not decrementing, always showing same value

**Solutions:**
- Check database: `daily_quotas` table
- Verify quota service is called
- Check browser console for errors

### Issue 4: Translation Not Working
**Symptoms:** Answers always in English

**Solutions:**
- Check language detection in question route
- Verify translation service is called
- Check answer route translation logic

---

## ✅ Success Criteria

### Docker Setup ✅
- [ ] Both containers running
- [ ] No errors in logs
- [ ] Ports accessible

### AnythingLLM ✅
- [ ] Dashboard accessible
- [ ] API responding
- [ ] Workspace creation working
- [ ] Context sync working

### Application Features ✅
- [ ] Authentication working
- [ ] Profile setup working
- [ ] Palm matching working
- [ ] Q&A system working
- [ ] Translation working
- [ ] Quota system working

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Docker Status:
[ ] Qdrant: Running
[ ] AnythingLLM: Running

API Tests:
[ ] Authentication: Pass/Fail
[ ] Quota API: Pass/Fail
[ ] Questions API: Pass/Fail
[ ] Answer API: Pass/Fail

Feature Tests:
[ ] Registration: Pass/Fail
[ ] Login: Pass/Fail
[ ] Dashboard: Pass/Fail
[ ] Chat: Pass/Fail
[ ] Quota Display: Pass/Fail
[ ] Translation: Pass/Fail

Issues Found:
1. ___________
2. ___________

Notes:
___________
```

---

## 🚀 Quick Test Script

Run this PowerShell script for quick tests:

```powershell
Write-Host "=== Testing Whispering Palms ===" -ForegroundColor Cyan

# Test 1: Docker Containers
Write-Host "`n[1/5] Testing Docker Containers..." -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String "qdrant|anythingllm"

# Test 2: Qdrant Health
Write-Host "`n[2/5] Testing Qdrant..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:6333/health -UseBasicParsing
    Write-Host "Qdrant: OK" -ForegroundColor Green
} catch {
    Write-Host "Qdrant: FAILED" -ForegroundColor Red
}

# Test 3: AnythingLLM Health
Write-Host "`n[3/5] Testing AnythingLLM..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:3001/api/v1/system/health -UseBasicParsing
    Write-Host "AnythingLLM: OK" -ForegroundColor Green
} catch {
    Write-Host "AnythingLLM: FAILED (may need setup)" -ForegroundColor Yellow
}

# Test 4: Application
Write-Host "`n[4/5] Testing Application..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing
    Write-Host "Application: OK" -ForegroundColor Green
} catch {
    Write-Host "Application: FAILED" -ForegroundColor Red
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
Write-Host "`nNext: Test in browser at http://localhost:3000" -ForegroundColor Green
```
