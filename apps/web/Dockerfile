# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
RUN (apk add --no-cache curl libc6-compat || \
     (sed -i 's/dl-cdn.alpinelinux.org/mirrors.edge.kernel.org/g' /etc/apk/repositories && apk add --no-cache curl libc6-compat)) && \
    (corepack enable && corepack prepare pnpm@12.14.0 --activate || npm install -g pnpm@12.14.0)

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
COPY apps/web ./apps/web
ENV DOCKER_BUILD=1
RUN pnpm --filter @mikrotik-billing/shared run build && \
    pnpm --filter @mikrotik-billing/web run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

CMD ["node", "apps/web/server.js"]
