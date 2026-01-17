# AnythingLLM Manual Setup Script
# Qdrant Docker में running है, AnythingLLM manually install करेंगे

Write-Host "=== AnythingLLM Manual Setup ===" -ForegroundColor Cyan

# Step 1: Check Prerequisites
Write-Host "`n[1/6] Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# Step 2: Check Qdrant
Write-Host "`n[2/6] Checking Qdrant (Docker)..." -ForegroundColor Yellow
$qdrantStatus = docker ps --filter "name=qdrant" --format "{{.Names}}" 2>$null
if ($qdrantStatus -match "qdrant") {
    Write-Host "Qdrant is running: $qdrantStatus" -ForegroundColor Green
} else {
    Write-Host "WARNING: Qdrant not found in Docker. Starting Qdrant..." -ForegroundColor Yellow
    docker start qdrant 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Could not start Qdrant. Please start it manually." -ForegroundColor Red
        exit 1
    }
    Start-Sleep -Seconds 3
    Write-Host "Qdrant started!" -ForegroundColor Green
}

# Step 3: Clone/Check Repository
Write-Host "`n[3/6] Checking AnythingLLM repository..." -ForegroundColor Yellow
$anythingllmPath = "D:\Projects\anythingllm\server"
if (-not (Test-Path $anythingllmPath)) {
    Write-Host "Repository not found. Cloning..." -ForegroundColor Yellow
    $parentPath = Split-Path $anythingllmPath -Parent
    if (-not (Test-Path $parentPath)) {
        New-Item -ItemType Directory -Path $parentPath -Force | Out-Null
    }
    Set-Location $parentPath
    git clone https://github.com/mintplex-labs/anythingllm.git
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to clone repository" -ForegroundColor Red
        exit 1
    }
    Write-Host "Repository cloned!" -ForegroundColor Green
} else {
    Write-Host "Repository found at: $anythingllmPath" -ForegroundColor Green
}

Set-Location $anythingllmPath

# Step 4: Install Dependencies
Write-Host "`n[4/6] Installing dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed!" -ForegroundColor Green
} else {
    Write-Host "Dependencies already installed" -ForegroundColor Green
}

# Step 5: Create Storage Directories
Write-Host "`n[5/6] Creating storage directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "storage" -Force | Out-Null
New-Item -ItemType Directory -Path "storage/database" -Force | Out-Null
Write-Host "Storage directories created!" -ForegroundColor Green

# Step 6: Check/Create .env file
Write-Host "`n[6/6] Checking .env configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
PORT=3001
NODE_ENV=development
VECTOR_DB=qdrant
QDRANT_URL=http://localhost:6333
STORAGE_DIR=./storage
DATABASE_TYPE=sqlite
DATABASE_PATH=./storage/database.db
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host ".env file created! Please edit it to add LLM provider settings." -ForegroundColor Yellow
} else {
    Write-Host ".env file exists" -ForegroundColor Green
}

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file and add LLM provider (OpenAI or Ollama)" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Open: http://localhost:3001" -ForegroundColor White
Write-Host "4. Create admin account" -ForegroundColor White
Write-Host "5. Configure LLM provider in settings" -ForegroundColor White
Write-Host "`nTo start server, run:" -ForegroundColor Yellow
Write-Host "  cd $anythingllmPath" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Cyan
