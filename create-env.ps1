# PowerShell script to create .env file with Cloudinary credentials
# Usage: Run this script in PowerShell

$envContent = @"
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://khai:khai12345@cluster0.froxx5x.mongodb.net/mangahay?retryWrites=true&w=majority&appName=Cluster0

# Session Secret (for web authentication)
SESSION_SECRET=your-secret-key-change-in-production

# JWT Configuration (for mobile app authentication)
JWT_SECRET=your-jwt-secret-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-jwt-refresh-secret-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=*

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dxgghdt9x
CLOUDINARY_API_KEY=916735713855218
CLOUDINARY_API_SECRET=GY9am8X6aZqDW_dr86ZYrZmDjQ0
"@

$envPath = Join-Path $PSScriptRoot ".env"

# Create .env file
$envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline

Write-Host " .env file created successfully at: $envPath" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm install" -ForegroundColor Cyan
Write-Host "2. Run: npm run migrate-cloudinary" -ForegroundColor Cyan
Write-Host "3. Run: npm start" -ForegroundColor Cyan
