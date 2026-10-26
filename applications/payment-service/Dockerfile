FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY shared/tsconfig.json ./shared/tsconfig.json
COPY shared/logger/package.json ./shared/logger/package.json
COPY applications/payment-service/package.json ./applications/payment-service/package.json

RUN pnpm install --frozen-lockfile

COPY shared ./shared
COPY applications/payment-service ./applications/payment-service

WORKDIR /app/applications/payment-service

EXPOSE 3032

CMD ["pnpm", "run", "dev"]

