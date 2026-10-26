FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY shared/tsconfig.json ./shared/tsconfig.json
COPY shared/logger/package.json ./shared/logger/package.json
COPY applications/tuition-service/package.json ./applications/tuition-service/package.json

RUN pnpm install --frozen-lockfile

COPY shared ./shared
COPY applications/tuition-service ./applications/tuition-service

WORKDIR /app/applications/tuition-service

EXPOSE 3031

CMD ["pnpm", "run", "dev"]

