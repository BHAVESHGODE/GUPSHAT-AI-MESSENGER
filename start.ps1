# GuppShup Chat Startup Script
Write-Host "Starting GuppShup Chat Application..." -ForegroundColor Green

# Check if .env file exists in backend
if (!(Test-Path "backend\.env")) {
    Write-Host "Warning: backend\.env file not found. Please create it with your environment variables." -ForegroundColor Yellow
}

# Start the application
Write-Host "Starting backend and frontend servers..." -ForegroundColor Cyan
npm run dev