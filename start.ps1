$ErrorActionPreference = "Stop"

if (-not (Test-Path "applications/gateway-service/.env")) {
@"
PORT=8000
SECRET_KEY="shikisiudepzai"
USER_SERVICE_URL="http://localhost:3030"
TUITION_SERVICE_URL="http://localhost:3031"
PAYMENT_SERVICE_URL="http://localhost:3032"
"@ | Set-Content "applications/gateway-service/.env"
}

if (-not (Test-Path "applications/user-service/.env")) {
@"
DATABASE_URL="postgresql://admin:123456@localhost:5111/user-db"
PORT=3030
SECRET_KEY="shikisiudepzai"
PAYMENT_SERVICE_URL="http://localhost:3032"
"@ | Set-Content "applications/user-service/.env"
}

if (-not (Test-Path "applications/tuition-service/.env")) {
@"
DATABASE_URL="postgresql://admin:123456@localhost:5112/tuition-db"
PORT=3031
SECRET_KEY="shikisiudepzai"
"@ | Set-Content "applications/tuition-service/.env"
}

if (-not (Test-Path "applications/payment-service/.env")) {
@"
DATABASE_URL="postgresql://admin:123456@localhost:5113/payment-db"
PORT=3032
SECRET_KEY="shikisiudepzai"
USER_SERVICE_URL="http://localhost:3030"
TUITION_SERVICE_URL="http://localhost:3031"
OTP_SERVICE_URL="http://localhost:3033"
"@ | Set-Content "applications/payment-service/.env"
}

if (-not (Test-Path "applications/otp-service/.env")) {
@"
REDIS_URL="redis://localhost:6379"
PORT=3033
SECRET_KEY="shikisiudepzai"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="SOA iBanking <your-email@gmail.com>"
"@ | Set-Content "applications/otp-service/.env"
}

pnpm install
docker compose up -d

do { Start-Sleep -Seconds 1 } until ((docker exec user-db pg_isready -U admin -d user-db 2>$null) -match "accepting connections")
do { Start-Sleep -Seconds 1 } until ((docker exec tuition-db pg_isready -U admin -d tuition-db 2>$null) -match "accepting connections")
do { Start-Sleep -Seconds 1 } until ((docker exec payment-db pg_isready -U admin -d payment-db 2>$null) -match "accepting connections")

pnpm --filter @soa/service/user run db:update
pnpm --filter @soa/service/tuition run db:update
pnpm --filter @soa/service/payment run db:update

pnpm --filter @soa/service/user run seed
pnpm --filter @soa/service/tuition run seed
pnpm --filter @soa/service/payment run seed

$frontendProcess = Start-Process pnpm -ArgumentList "dlx", "serve", "applications/frontend", "-l", "3000" -PassThru
Start-Sleep -Seconds 1
Start-Process "http://localhost:3000"

try {
    pnpm run dev
}
finally {
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        taskkill /PID $frontendProcess.Id /T /F 2>$null
    }
}

