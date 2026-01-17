# AnythingLLM Manual Setup Steps

## Step 1: Fix Docker Hub Authentication

### Option A: Verify Email via Website (Recommended)
1. Open browser: https://hub.docker.com/
2. Click "Sign In" (top right)
3. Login with username: `sujeet1724`
4. Check your email inbox for verification email
5. Click the verification link in the email
6. Email verified ✅

### Option B: Login via Docker Desktop
1. Open Docker Desktop application
2. Click on your profile icon (top right corner)
3. Select "Sign in" or "Account Settings"
4. Enter Docker Hub credentials
5. Complete email verification if prompted

### Option C: Command Line Login (After email verification)
```powershell
docker logout
docker login
# Enter username: sujeet1724
# Enter password: [your password]
```

---

## Step 2: Start AnythingLLM Containers

Open PowerShell and run:

```powershell
# Navigate to anythingllm directory
cd D:\Projects\AIASTRO\anythingllm

# Start containers
docker-compose up -d
```

**Expected Output:**
```
Pulling anythingllm...
Pulling qdrant...
Creating qdrant ...
Creating anythingllm ...
Starting qdrant ...
Starting anythingllm ...
```

**Wait 2-3 minutes** for images to download and containers to start.

---

## Step 3: Verify Containers Are Running

```powershell
docker ps
```

**You should see:**
```
CONTAINER ID   IMAGE                          STATUS         PORTS
xxxxxxxxx      mintplexlabs/anythingllm:latest   Up 2 minutes   0.0.0.0:3001->3001/tcp
xxxxxxxxx      qdrant/qdrant:latest             Up 2 minutes   0.0.0.0:6333->6333/tcp, 0.0.0.0:6334->6334/tcp
```

If containers are not running, check logs:
```powershell
docker logs anythingllm
docker logs qdrant
```

---

## Step 4: Access AnythingLLM Dashboard

1. Open browser: **http://localhost:3001**
2. **First time setup:**
   - Create admin account (email + password)
   - Save credentials securely

---

## Step 5: Configure LLM Provider

### Option A: Ollama (Recommended for Local Testing)

**5.1 Install Ollama:**
- Download: https://ollama.com/download
- Install Ollama
- Run in terminal:
  ```powershell
  ollama pull mistral
  ```

**5.2 Configure in AnythingLLM:**
1. In AnythingLLM dashboard → **Settings** → **LLM Preference**
2. Select **"Ollama"** as provider
3. Enter URL: `http://host.docker.internal:11434`
4. Model: `mistral`
5. Click **"Save"**

### Option B: Hugging Face (Free API)

1. Get API key: https://huggingface.co/settings/tokens
2. In AnythingLLM → Settings → LLM Preference
3. Select **"Hugging Face"**
4. Enter API key
5. Select model (e.g., `mistralai/Mistral-7B-Instruct-v0.2`)
6. Click **"Save"**

### Option C: OpenAI-Compatible API

1. In AnythingLLM → Settings → LLM Preference
2. Select **"OpenAI"** or **"Custom OpenAI"**
3. Enter API URL and key
4. Select model
5. Click **"Save"**

---

## Step 6: Test AnythingLLM Integration

### Test 1: Create Workspace via API

```powershell
# Test workspace creation (from your Next.js app)
curl http://localhost:3001/api/v1/workspace/new -X POST -H "Content-Type: application/json" -d '{"name":"Test Workspace"}'
```

### Test 2: Check Qdrant (Vector DB)

Open browser: **http://localhost:6333/dashboard**

You should see Qdrant dashboard.

---

## Step 7: Test Integration with Your App

### Update Environment Variables

Add to your `.env.local` file:

```env
ANYTHINGLLM_API_URL=http://localhost:3001
ANYTHINGLLM_API_KEY=  # Optional, if you set API key in AnythingLLM
```

### Test Workspace Creation

1. Start your Next.js app: `npm run dev`
2. Register a new user (or use existing)
3. Check if workspace is created automatically
4. Check database: `anythingllm_workspaces` table should have entry

---

## Step 8: Useful Commands

### View Container Logs
```powershell
docker logs anythingllm
docker logs qdrant
docker logs anythingllm --follow  # Follow logs in real-time
```

### Stop Containers
```powershell
cd D:\Projects\AIASTRO\anythingllm
docker-compose down
```

### Start Containers Again
```powershell
cd D:\Projects\AIASTRO\anythingllm
docker-compose up -d
```

### Restart Containers
```powershell
cd D:\Projects\AIASTRO\anythingllm
docker-compose restart
```

### Remove Everything (Clean Start)
```powershell
cd D:\Projects\AIASTRO\anythingllm
docker-compose down -v  # Removes volumes too
docker-compose up -d
```

---

## Troubleshooting

### Issue: Containers won't start
- Check Docker Desktop is running
- Check ports 3001, 6333, 6334 are not in use
- Check logs: `docker logs anythingllm`

### Issue: Can't access http://localhost:3001
- Wait 1-2 minutes for container to fully start
- Check container status: `docker ps`
- Check logs: `docker logs anythingllm`

### Issue: LLM not responding
- Verify LLM provider is configured correctly
- Check Ollama is running (if using Ollama): `ollama list`
- Check API key is valid (if using API)

### Issue: Images won't pull
- Verify Docker Hub email is verified
- Try: `docker logout` then `docker login`
- Check internet connection

---

## Next Steps After Setup

1. ✅ AnythingLLM running on http://localhost:3001
2. ✅ LLM provider configured
3. ✅ Test workspace creation
4. ✅ Test context document sync
5. ✅ Test chat/RAG functionality
6. ✅ Integrate with your Next.js app

---

## Summary Checklist

- [ ] Docker Hub email verified
- [ ] Docker login successful
- [ ] Containers started (`docker-compose up -d`)
- [ ] Containers running (`docker ps`)
- [ ] AnythingLLM accessible (http://localhost:3001)
- [ ] Admin account created
- [ ] LLM provider configured
- [ ] Test workspace created
- [ ] Integration tested with Next.js app

---

**Once you complete these steps, let me know and I'll help test the integration!**
