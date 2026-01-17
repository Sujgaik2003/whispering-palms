# ✅ AnythingLLM Docker Issue - FIXED!

## Problem
The `mintplexlabs/anythingllm:latest` image was configured to run as user `anythingllm` which doesn't exist in the image, causing:
```
Error response from daemon: unable to find user anythingllm: no matching entries in passwd file
```

## Solution
Use `docker run` with `--user 0:0` (numeric UID for root) instead of docker-compose, and run the entrypoint directly.

## ✅ Working Command

```powershell
cd D:\Projects\AIASTRO\anythingllm

# Start Qdrant
docker run -d `
  --name qdrant `
  --network anythingllm-network `
  -p 6333:6333 `
  -p 6334:6334 `
  -v "${PWD}\qdrant_storage:/qdrant/storage" `
  --restart unless-stopped `
  qdrant/qdrant:latest

# Start AnythingLLM (with user fix)
docker run -d `
  --name anythingllm `
  --network anythingllm-network `
  -p 3001:3001 `
  -v "${PWD}\storage:/app/server/storage" `
  -e STORAGE_DIR=/app/server/storage `
  -e VECTOR_DB=qdrant `
  -e QDRANT_URL=http://qdrant:6333 `
  --restart unless-stopped `
  --user 0:0 `
  --entrypoint /bin/sh `
  mintplexlabs/anythingllm:latest `
  -c "groupadd -g 1000 anythingllm 2>/dev/null || true; useradd -u 1000 -g 1000 -m anythingllm 2>/dev/null || true; chown -R anythingllm:anythingllm /app/server/storage 2>/dev/null || true; chown -R anythingllm:anythingllm /app 2>/dev/null || true; exec /usr/local/bin/docker-entrypoint.sh"
```

## 🚀 Easy Way: Use the Script

```powershell
cd D:\Projects\AIASTRO\anythingllm
.\docker-run-fix.ps1
```

## 📋 Current Status

✅ **Qdrant**: Running on port 6333  
✅ **AnythingLLM**: Running and healthy on port 3001

## 🌐 Access AnythingLLM

Open in browser: **http://localhost:3001**

## 📝 Docker Desktop UI से करने के लिए

1. **Docker Desktop** खोलें
2. **Images** tab → `mintplexlabs/anythingllm:latest` → **Run**
3. **Optional settings** में:
   - **Container name**: `anythingllm`
   - **Ports**: `3001:3001`
   - **Volumes**: `D:\Projects\AIASTRO\anythingllm\storage:/app/server/storage`
   - **Environment variables**:
     - `STORAGE_DIR=/app/server/storage`
     - `VECTOR_DB=qdrant`
     - `QDRANT_URL=http://qdrant:6333`
   - **Command override**: 
     ```
     /bin/sh -c "groupadd -g 1000 anythingllm 2>/dev/null || true; useradd -u 1000 -g 1000 -m anythingllm 2>/dev/null || true; chown -R anythingllm:anythingllm /app/server/storage 2>/dev/null || true; chown -R anythingllm:anythingllm /app 2>/dev/null || true; exec /usr/local/bin/docker-entrypoint.sh"
     ```
   - **User override**: `0:0` (Advanced settings में)
4. **Run** click करें

## 🔧 Useful Commands

```powershell
# Check status
docker ps -a

# View logs
docker logs anythingllm
docker logs qdrant

# Stop containers
docker stop anythingllm qdrant

# Start containers (if already created)
docker start anythingllm qdrant

# Remove containers
docker rm anythingllm qdrant
```

## ⚠️ Note

`docker-compose.yml` अभी काम नहीं कर रहा क्योंकि Docker Compose user check को bypass नहीं कर सकता। `docker run` command use करें या `docker-run-fix.ps1` script run करें।
