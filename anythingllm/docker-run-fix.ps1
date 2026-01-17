# PowerShell script to run AnythingLLM container with user fix
# This bypasses the docker-compose user issue by using docker run directly

Write-Host "=== Starting AnythingLLM with User Fix ===" -ForegroundColor Cyan

# Change to script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Stop and remove existing containers
Write-Host "`nStopping existing containers..." -ForegroundColor Yellow
docker stop anythingllm qdrant 2>$null
docker rm anythingllm qdrant 2>$null

# Create network if it doesn't exist
Write-Host "`nCreating network..." -ForegroundColor Yellow
docker network create anythingllm-network 2>$null

# Start Qdrant first
Write-Host "`nStarting Qdrant..." -ForegroundColor Yellow
docker run -d `
  --name qdrant `
  --network anythingllm-network `
  -p 6333:6333 `
  -p 6334:6334 `
  -v "${scriptDir}\qdrant_storage:/qdrant/storage" `
  --restart unless-stopped `
  qdrant/qdrant:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error starting Qdrant!" -ForegroundColor Red
    exit 1
}

Write-Host "Qdrant started successfully!" -ForegroundColor Green
Start-Sleep -Seconds 3

# Start AnythingLLM with user override workaround
# Using --user root to bypass the user check, then creating user inside
Write-Host "`nStarting AnythingLLM with user fix..." -ForegroundColor Yellow
docker run -d `
  --name anythingllm `
  --network anythingllm-network `
  -p 3001:3001 `
  -v "${scriptDir}\storage:/app/server/storage" `
  -e STORAGE_DIR=/app/server/storage `
  -e VECTOR_DB=qdrant `
  -e QDRANT_URL=http://qdrant:6333 `
  --restart unless-stopped `
  --user 0:0 `
  --entrypoint /bin/sh `
  mintplexlabs/anythingllm:latest `
  -c "groupadd -g 1000 anythingllm 2>/dev/null || true; useradd -u 1000 -g 1000 -m anythingllm 2>/dev/null || true; mkdir -p /app/server/storage && chown -R anythingllm:anythingllm /app/server/storage 2>/dev/null || true; exec /usr/local/bin/docker-entrypoint.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error starting AnythingLLM!" -ForegroundColor Red
    Write-Host "Checking logs..." -ForegroundColor Yellow
    docker logs anythingllm --tail 20
    exit 1
}

Write-Host "`n=== Checking Container Status ===" -ForegroundColor Cyan
Start-Sleep -Seconds 5
docker ps -a | Select-String -Pattern "anythingllm|qdrant"

Write-Host "`n=== Container Logs (AnythingLLM - Last 30 lines) ===" -ForegroundColor Cyan
docker logs anythingllm --tail 30

Write-Host "`n=== Status ===" -ForegroundColor Cyan
$status = docker ps --filter "name=anythingllm" --format "{{.Status}}"
if ($status) {
    Write-Host "AnythingLLM is running! Status: $status" -ForegroundColor Green
    Write-Host "`nAccess AnythingLLM at: http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "AnythingLLM failed to start. Check logs above." -ForegroundColor Red
    Write-Host "`nTrying to get more details..." -ForegroundColor Yellow
    docker logs anythingllm --tail 50
}
