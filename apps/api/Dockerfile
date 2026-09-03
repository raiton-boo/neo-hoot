FROM node:24-slim

RUN apt-get update && apt-get install -y --no-install-recommends procps && rm -rf /var/lib/apt/lists/*

RUN corepack enable

ENV CI=true

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/api

CMD ["pnpm", "start:dev"]
