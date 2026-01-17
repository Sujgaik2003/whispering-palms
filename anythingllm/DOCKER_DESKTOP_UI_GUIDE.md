# Docker Desktop UI से AnythingLLM Fix करने के Steps

## Method 1: Docker Desktop UI से Container Run करें

### Step 1: Qdrant Container Start करें

1. **Docker Desktop खोलें**
2. **Images tab** पर जाएं
3. `qdrant/qdrant:latest` image search करें
4. **Run** button click करें
5. **Optional settings** में:
   - **Container name**: `qdrant`
   - **Ports**: 
     - `6333:6333` (Host:Container)
     - `6334:6334` (Host:Container)
   - **Volumes**: 
     - `D:\Projects\AIASTRO\anythingllm\qdrant_storage:/qdrant/storage`
   - **Restart policy**: `Unless stopped`
6. **Run** button click करें

### Step 2: AnythingLLM Container Start करें (User Fix के साथ)

1. **Images tab** पर जाएं
2. `mintplexlabs/anythingllm:latest` image search करें
3. **Run** button click करें
4. **Optional settings** में:
   - **Container name**: `anythingllm`
   - **Ports**: `3001:3001` (Host:Container)
   - **Volumes**: 
     - `D:\Projects\AIASTRO\anythingllm\storage:/app/server/storage`
   - **Environment variables** (Add करें):
     - `STORAGE_DIR=/app/server/storage`
     - `VECTOR_DB=qdrant`
     - `QDRANT_URL=http://qdrant:6333`
   - **Restart policy**: `Unless stopped`
   - **Command override**: 
     ```
     /bin/sh -c "groupadd -g 1000 anythingllm 2>/dev/null || true; useradd -u 1000 -g 1000 -m anythingllm 2>/dev/null || true; chown -R anythingllm:anythingllm /app/server/storage 2>/dev/null || true; su - anythingllm -c '/usr/local/bin/docker-entrypoint.sh' || /usr/local/bin/docker-entrypoint.sh"
     ```
   - **Network**: `bridge` (default) - Qdrant को same network में run करें
5. **Run** button click करें

### Step 3: Network Connect करें

1. **Containers tab** पर जाएं
2. `anythingllm` container select करें
3. **Settings** → **Network** में
4. `qdrant` container के साथ same network ensure करें
5. या **Connect to network** से manually connect करें

---

## Method 2: Docker Desktop में Container Edit करें

अगर container fail हो जाए, तो:

1. **Containers tab** पर जाएं
2. Failed container (`anythingllm`) select करें
3. **Settings** → **Command** में entrypoint override करें
4. **Restart** button click करें

---

## Method 3: PowerShell Script Use करें (सबसे आसान)

`docker-run-fix.ps1` script run करें:

```powershell
cd D:\Projects\AIASTRO\anythingllm
.\docker-run-fix.ps1
```

यह automatically:
- Containers stop/remove करेगा
- Qdrant start करेगा
- AnythingLLM को user fix के साथ start करेगा
- Status और logs दिखाएगा

---

## Troubleshooting

### Container Start नहीं हो रहा:
1. Docker Desktop → **Settings** → **Resources** में memory/CPU check करें
2. **Troubleshoot** → **Clean / Purge data** try करें
3. Docker Desktop restart करें

### Network Connection Issue:
1. Containers → **Settings** → **Network** में same network ensure करें
2. या manually network create करें और दोनों containers connect करें

### Logs देखने के लिए:
1. Container select करें
2. **Logs** tab click करें
