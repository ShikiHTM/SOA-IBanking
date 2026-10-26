# SOA-IBanking — Tuition Payment Microservices

A tuition payment iBanking system built with a **Microservices Architecture** inside a **pnpm workspace monorepo** (Node.js, TypeScript, Hono, Prisma 8, PostgreSQL, Redis, Nodemailer).

---

## 1. Architecture & Services Overview

| Service | Package Name | Default Port | Database / Infrastructure | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Gateway Service** | `@soa/service/gateway` | `8000` | — | Public API entrypoint ([docs/API.md](./docs/API.md)), JWT verification, and request routing to internal services |
| **User Service** | `@soa/service/user` | `3030` | PostgreSQL (`user-db` : `5111`) | User authentication (`/auth/login`), user profile, and ledger queries |
| **Tuition Service** | `@soa/service/tuition` | `3031` | PostgreSQL (`tuition-db` : `5112`) | Student records and tuition invoice management |
| **Payment Service** | `@soa/service/payment` | `3032` | PostgreSQL (`payment-db` : `5113`) | User balance (`Ledger`), payment creation, and concurrency-safe OTP payment verification |
| **OTP Service** | `@soa/service/otp` | `3033` | Redis (`otp-redis` : `6379`) | 6-digit OTP generation/verification (1-to-1 with `transaction_id`, 5-minute TTL) and async email delivery via Redis Work Queue |

---

## 2. Prerequisites

- **Node.js** >= 22.x
- **pnpm** >= 10.x (`corepack enable`)
- **Docker** & **Docker Compose** (for the 3 PostgreSQL 16 instances and 1 Redis 7 instance)

---

## 3. One-Command Quick Start

Run the startup script from the repository root to automatically generate `.env` files, install dependencies, start Docker containers, push database schemas, seed initial test data, and launch all 5 services concurrently:

### Windows (PowerShell):
```powershell
.\start.ps1
```

### Linux / macOS / Git Bash:
```bash
chmod +x start.sh
./start.sh
```

> Once started, all Public API endpoints are live at **`http://localhost:8000`** (see full API documentation in [docs/API.md](./docs/API.md)).

---

## 4. Manual Step-by-Step Setup

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment Variables (`.env`)
Create a `.env` file in each `applications/<service>` directory (or copy from `.env.example`):

- **`applications/gateway-service/.env`**
  ```env
  PORT=8000
  SECRET_KEY="shikisiudepzai"
  USER_SERVICE_URL="http://localhost:3030"
  TUITION_SERVICE_URL="http://localhost:3031"
  PAYMENT_SERVICE_URL="http://localhost:3032"
  ```
- **`applications/user-service/.env`**
  ```env
  DATABASE_URL="postgresql://admin:123456@localhost:5111/user-db"
  PORT=3030
  SECRET_KEY="shikisiudepzai"
  PAYMENT_SERVICE_URL="http://localhost:3032"
  ```
- **`applications/tuition-service/.env`**
  ```env
  DATABASE_URL="postgresql://admin:123456@localhost:5112/tuition-db"
  PORT=3031
  SECRET_KEY="shikisiudepzai"
  ```
- **`applications/payment-service/.env`**
  ```env
  DATABASE_URL="postgresql://admin:123456@localhost:5113/payment-db"
  PORT=3032
  SECRET_KEY="shikisiudepzai"
  USER_SERVICE_URL="http://localhost:3030"
  TUITION_SERVICE_URL="http://localhost:3031"
  OTP_SERVICE_URL="http://localhost:3033"
  ```
- **`applications/otp-service/.env`** *(configure `SMTP_USER` and `SMTP_PASS` with an App Password for real email delivery; generated OTP codes are also logged to the `otp-service` console for quick testing)*
  ```env
  REDIS_URL="redis://localhost:6379"
  PORT=3033
  SECRET_KEY="shikisiudepzai"
  SMTP_HOST="smtp.gmail.com"
  SMTP_PORT=587
  SMTP_USER="your-email@gmail.com"
  SMTP_PASS="your-app-password"
  SMTP_FROM="SOA iBanking <your-email@gmail.com>"
  ```

### Step 3: Start PostgreSQL & Redis Containers
```bash
docker compose up -d
```

### Step 4: Push Database Schemas & Seed Test Data
```bash
# Push Prisma 8 contracts to PostgreSQL databases
pnpm --filter @soa/service/user run db:update
pnpm --filter @soa/service/tuition run db:update
pnpm --filter @soa/service/payment run db:update

# Seed 3 users, 3 students + tuition invoices, and 3 ledgers (50,000,000 balance per user)
pnpm --filter @soa/service/user run seed
pnpm --filter @soa/service/tuition run seed
pnpm --filter @soa/service/payment run seed
```

### Step 5: Run the Services
Start all services in parallel:
```bash
pnpm run dev
```
Or run each service individually in separate terminals:
```bash
pnpm gateway:dev
pnpm user:dev
pnpm tuition:dev
pnpm payment:dev
pnpm otp:dev
```

---

## 5. Seeded Test Data

### Users & Ledgers
| User ID | Username | Password | Email | Initial Balance (`balance`) |
| :--- | :--- | :--- | :--- | :--- |
| `11111111-1111-4111-8111-111111111111` | `john_doe` | `password123` | `john.doe@example.com` | `50,000,000` |
| `22222222-2222-4222-8222-222222222222` | `jane_smith` | `password123` | `jane.smith@example.com` | `50,000,000` |
| `33333333-3333-4333-8333-333333333333` | `alice_wonder` | `password123` | `alice.wonder@example.com` | `50,000,000` |

### Students & Tuition Invoices
| Student ID | Full Name | Tuition ID (`tuition_id`) | Amount (`amount`) | Status (`status`) |
| :--- | :--- | :--- | :--- | :--- |
| `520H0001` | Nguyen Van A | `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` | `15,000,000` | `pending` |
| `521K0002` | Tran Thi B | `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb` | `12,000,000` | `overdue` |
| `522H0003` | Le Van C | `cccccccc-cccc-4ccc-8ccc-cccccccccccc` | `18,000,000` | `paid` |
