# syntax=docker/dockerfile:1
FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends openssl ca-certificates && \
    npm install -g pnpm@12.14.0 && \
    rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/
ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/worker ./apps/worker
RUN pnpm --filter @mikrotik-billing/shared run build && \
    pnpm --filter @mikrotik-billing/database run db:generate && \
    pnpm --filter @mikrotik-billing/database run build && \
    pnpm --filter @mikrotik-billing/worker run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/worker ./apps/worker
CMD ["node", "apps/worker/dist/main.js"]
