FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY shared/tsconfig.json ./shared/tsconfig.json
COPY shared/logger/package.json ./shared/logger/package.json
COPY applications/gateway-service/package.json ./applications/gateway-service/package.json

RUN pnpm install --frozen-lockfile

COPY shared ./shared
COPY applications/gateway-service ./applications/gateway-service

WORKDIR /app/applications/gateway-service

EXPOSE 8000

CMD ["pnpm", "run", "dev"]

