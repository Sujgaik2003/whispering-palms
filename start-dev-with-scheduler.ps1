# PowerShell script to start dev server with email scheduler
# This automatically runs both the Next.js dev server and email scheduler

Write-Host "🚀 Starting development server with automatic email scheduler..." -ForegroundColor Green
Write-Host ""

# Start both processes
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run email:scheduler"

Write-Host "✅ Development server and email scheduler started!" -ForegroundColor Green
Write-Host "📧 Email scheduler will automatically check and send emails every minute" -ForegroundColor Cyan
Write-Host "💡 Close both PowerShell windows to stop" -ForegroundColor Yellow
