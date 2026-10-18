# syntax=docker/dockerfile:1
FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends openssl ca-certificates curl && \
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
COPY apps/api ./apps/api
RUN pnpm --filter @mikrotik-billing/shared run build && \
    pnpm --filter @mikrotik-billing/database run db:generate && \
    pnpm --filter @mikrotik-billing/database run build && \
    pnpm --filter @mikrotik-billing/api run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api ./apps/api
COPY infrastructure/docker-entrypoint-api.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/main.js"]
