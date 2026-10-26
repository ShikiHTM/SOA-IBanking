FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY shared/tsconfig.json ./shared/tsconfig.json
COPY shared/logger/package.json ./shared/logger/package.json
COPY applications/otp-service/package.json ./applications/otp-service/package.json

RUN pnpm install --frozen-lockfile

COPY shared ./shared
COPY applications/otp-service ./applications/otp-service

WORKDIR /app/applications/otp-service

EXPOSE 3033

CMD ["pnpm", "run", "dev"]

