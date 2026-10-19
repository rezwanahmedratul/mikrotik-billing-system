# syntax=docker/dockerfile:1

# ------------------------------------------------------------
# 1. Base Image with Node.js, pnpm, and OpenSSL (Alpine Linux)
# ------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

RUN (apk add --no-cache openssl ca-certificates curl libc6-compat || \
     (sed -i 's/dl-cdn.alpinelinux.org/mirrors.edge.kernel.org/g' /etc/apk/repositories && apk add --no-cache openssl ca-certificates curl libc6-compat)) && \
    (corepack enable && corepack prepare pnpm@12.14.0 --activate || npm install -g pnpm@12.14.0)

ENV NODE_ENV=production

# ------------------------------------------------------------
# 2. Dependencies Stage
# ------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy root monorepo manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package manifests
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/

# Install all dependencies (development included for building)
ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile

# ------------------------------------------------------------
# 3. Builder Stage
# ------------------------------------------------------------
FROM deps AS builder
WORKDIR /app

# Copy TypeScript configuration and source files
COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/api ./apps/api
COPY apps/worker ./apps/worker
COPY apps/web ./apps/web

# Build internal shared library
RUN pnpm --filter @mikrotik-billing/shared run build

# Generate Prisma Client and build database package
RUN pnpm --filter @mikrotik-billing/database run db:generate
RUN pnpm --filter @mikrotik-billing/database run build

# Build backend applications
RUN pnpm --filter @mikrotik-billing/api run build
RUN pnpm --filter @mikrotik-billing/worker run build

# Build Next.js frontend with standalone output
ENV NODE_ENV=production
ENV DOCKER_BUILD=1
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @mikrotik-billing/web run build

# ------------------------------------------------------------
# 4. Target: API (NestJS REST & Swagger Service)
# ------------------------------------------------------------
FROM base AS api
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api ./apps/api

# Copy entrypoint script
COPY infrastructure/docker-entrypoint-api.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/main.js"]

# ------------------------------------------------------------
# 5. Target: Worker (BullMQ Background Service)
# ------------------------------------------------------------
FROM base AS worker
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/worker ./apps/worker

CMD ["node", "apps/worker/dist/main.js"]

# ------------------------------------------------------------
# 6. Target: Web (Next.js Standalone Frontend - Alpine)
# ------------------------------------------------------------
FROM node:20-alpine AS web
WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

# Next.js standalone output contains minimal production artifacts
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

CMD ["node", "apps/web/server.js"]
