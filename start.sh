#!/usr/bin/env bash
set -e

if [ ! -f applications/gateway-service/.env ]; then
cat <<EOF > applications/gateway-service/.env
PORT=8000
SECRET_KEY="shikisiudepzai"
USER_SERVICE_URL="http://localhost:3030"
TUITION_SERVICE_URL="http://localhost:3031"
PAYMENT_SERVICE_URL="http://localhost:3032"
EOF
fi

if [ ! -f applications/user-service/.env ]; then
cat <<EOF > applications/user-service/.env
DATABASE_URL="postgresql://admin:123456@localhost:5111/user-db"
PORT=3030
SECRET_KEY="shikisiudepzai"
PAYMENT_SERVICE_URL="http://localhost:3032"
EOF
fi

if [ ! -f applications/tuition-service/.env ]; then
cat <<EOF > applications/tuition-service/.env
DATABASE_URL="postgresql://admin:123456@localhost:5112/tuition-db"
PORT=3031
SECRET_KEY="shikisiudepzai"
EOF
fi

if [ ! -f applications/payment-service/.env ]; then
cat <<EOF > applications/payment-service/.env
DATABASE_URL="postgresql://admin:123456@localhost:5113/payment-db"
PORT=3032
SECRET_KEY="shikisiudepzai"
USER_SERVICE_URL="http://localhost:3030"
TUITION_SERVICE_URL="http://localhost:3031"
OTP_SERVICE_URL="http://localhost:3033"
EOF
fi

if [ ! -f applications/otp-service/.env ]; then
cat <<EOF > applications/otp-service/.env
REDIS_URL="redis://localhost:6379"
PORT=3033
SECRET_KEY="shikisiudepzai"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="SOA iBanking <your-email@gmail.com>"
EOF
fi

pnpm install
docker compose up -d

until docker exec user-db pg_isready -U admin -d user-db >/dev/null 2>&1; do sleep 1; done
until docker exec tuition-db pg_isready -U admin -d tuition-db >/dev/null 2>&1; do sleep 1; done
until docker exec payment-db pg_isready -U admin -d payment-db >/dev/null 2>&1; do sleep 1; done

pnpm --filter @soa/service/user run db:update
pnpm --filter @soa/service/tuition run db:update
pnpm --filter @soa/service/payment run db:update

pnpm --filter @soa/service/user run seed
pnpm --filter @soa/service/tuition run seed
pnpm --filter @soa/service/payment run seed

pnpm dlx serve applications/frontend -l 3000 &
FRONTEND_PID=$!

sleep 1

URL="http://localhost:3000"
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
    open "$URL" >/dev/null 2>&1 &
elif command -v wslview >/dev/null 2>&1; then
    wslview "$URL" >/dev/null 2>&1 &
elif command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start "$URL" >/dev/null 2>&1 &
elif [ -n "$BROWSER" ]; then
    "$BROWSER" "$URL" >/dev/null 2>&1 &
fi

trap 'kill $FRONTEND_PID 2>/dev/null || true' EXIT INT TERM

pnpm run dev

