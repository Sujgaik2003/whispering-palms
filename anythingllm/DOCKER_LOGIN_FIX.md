# Docker Login Fix - Email Verification Required

## Issue
Docker Hub is requiring email verification before pulling images.

## Solution

### Option 1: Verify Email via Docker Hub Website (Recommended)

1. **Go to Docker Hub**: https://hub.docker.com/
2. **Login** with your account (username: sujeet1724)
3. **Check your email** for verification link
4. **Click the verification link** in the email
5. **Come back here** and we'll retry

### Option 2: Login via Docker Desktop

1. **Open Docker Desktop**
2. **Click on your profile icon** (top right)
3. **Select "Sign in"** or "Account Settings"
4. **Login** with your Docker Hub credentials
5. **Verify email** if prompted

### Option 3: Logout and Login Again

Run these commands in PowerShell (after verifying email):

```powershell
docker logout
docker login
# Enter your Docker Hub username and password
```

### Option 4: Use Docker Desktop GUI to Pull Images

1. Open Docker Desktop
2. Go to Images tab
3. Click "Pull" or search for:
   - `mintplexlabs/anythingllm:latest`
   - `qdrant/qdrant:latest`
4. Wait for images to download
5. Then run: `docker-compose up -d`

## After Email Verification

Once email is verified, run:

```powershell
cd D:\Projects\AIASTRO\anythingllm
docker-compose up -d
```

## Check Status

```powershell
docker ps
```

You should see:
- `anythingllm` container running on port 3001
- `qdrant` container running on port 6333

## Access AnythingLLM

After containers start, open browser:
- **AnythingLLM**: http://localhost:3001
- **Qdrant Dashboard**: http://localhost:6333/dashboard
