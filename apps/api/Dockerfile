FROM node:24-slim

RUN corepack enable

ENV CI=true

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/api

CMD ["pnpm", "start:dev"]
