# PowerShell script to start dev server with memory optimization
# Run: .\start-dev.ps1

Write-Host "=== Whispering Palms Dev Server ===" -ForegroundColor Cyan
Write-Host ""

# Clear cache first
Write-Host "Clearing cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host "Cache cleared" -ForegroundColor Green
}

# Set memory limit (6GB)
$env:NODE_OPTIONS = "--max-old-space-size=6144"

Write-Host "Memory limit: 6GB" -ForegroundColor Green
Write-Host "Starting Next.js dev server..." -ForegroundColor Green
Write-Host ""
Write-Host "First compilation may take 20-30 seconds" -ForegroundColor Yellow
Write-Host ""

# Start dev server using npm (handles Windows/Linux/Mac automatically)
npm run dev
