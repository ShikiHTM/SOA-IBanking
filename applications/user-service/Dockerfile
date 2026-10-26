FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY shared/tsconfig.json ./shared/tsconfig.json
COPY shared/logger/package.json ./shared/logger/package.json
COPY applications/user-service/package.json ./applications/user-service/package.json

RUN pnpm install --frozen-lockfile

COPY shared ./shared
COPY applications/user-service ./applications/user-service

WORKDIR /app/applications/user-service

EXPOSE 3030

CMD ["pnpm", "run", "dev"]

