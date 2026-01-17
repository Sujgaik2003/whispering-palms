# AnythingLLM Setup Script for Windows
# This script will help you set up AnythingLLM

Write-Host "=== AnythingLLM Setup Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
    } else {
        throw "Docker not found"
    }
} catch {
    Write-Host "✗ Docker is NOT installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Docker Desktop first:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    Write-Host "2. Install Docker Desktop" -ForegroundColor White
    Write-Host "3. Restart your computer" -ForegroundColor White
    Write-Host "4. Launch Docker Desktop and wait for it to start" -ForegroundColor White
    Write-Host "5. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to open Docker download page..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "https://www.docker.com/products/docker-desktop/"
    exit 1
}

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker is running" -ForegroundColor Green
    } else {
        throw "Docker not running"
    }
} catch {
    Write-Host "✗ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose.yml exists
Write-Host "Checking docker-compose.yml..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "✓ docker-compose.yml found" -ForegroundColor Green
} else {
    Write-Host "✗ docker-compose.yml not found!" -ForegroundColor Red
    Write-Host "Please make sure you're in the anythingllm directory." -ForegroundColor Yellow
    exit 1
}

# Check if containers are already running
Write-Host "Checking existing containers..." -ForegroundColor Yellow
$existing = docker ps -a --filter "name=anythingllm" --format "{{.Names}}"
if ($existing -eq "anythingllm") {
    Write-Host "AnythingLLM container exists. Checking status..." -ForegroundColor Yellow
    $running = docker ps --filter "name=anythingllm" --format "{{.Names}}"
    if ($running -eq "anythingllm") {
        Write-Host "✓ AnythingLLM is already running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access AnythingLLM at: http://localhost:3001" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "Container exists but is stopped. Starting..." -ForegroundColor Yellow
        docker start anythingllm qdrant
    }
} else {
    # Start containers
    Write-Host "Starting AnythingLLM containers..." -ForegroundColor Yellow
    Write-Host "This may take 2-3 minutes on first run..." -ForegroundColor Yellow
    Write-Host ""
    
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Containers started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Check if containers are running
        $running = docker ps --filter "name=anythingllm" --format "{{.Names}}"
        if ($running -eq "anythingllm") {
            Write-Host "✓ AnythingLLM is ready!" -ForegroundColor Green
        }
    } else {
        Write-Host "✗ Failed to start containers!" -ForegroundColor Red
        Write-Host "Check the error messages above." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open browser: http://localhost:3001" -ForegroundColor White
Write-Host "2. Create admin account (first time only)" -ForegroundColor White
Write-Host "3. Configure LLM provider in Settings" -ForegroundColor White
Write-Host ""
Write-Host "Recommended LLM Setup:" -ForegroundColor Cyan
Write-Host "- Install Ollama: https://ollama.com/download" -ForegroundColor White
Write-Host "- Run: ollama pull mistral" -ForegroundColor White
Write-Host "- In AnythingLLM: Use Ollama provider with URL: http://host.docker.internal:11434" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "- Stop: docker-compose down" -ForegroundColor White
Write-Host "- Start: docker-compose up -d" -ForegroundColor White
Write-Host "- Logs: docker logs anythingllm" -ForegroundColor White
Write-Host ""
