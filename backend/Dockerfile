# =============================================================================
# Backend Dockerfile — multi-stage (development + production)
# =============================================================================
# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
# OpenSSL required by Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json ./

# -----------------------------------------------------------------------------
# Install all dependencies (cached layer when package.json unchanged)
# -----------------------------------------------------------------------------
FROM base AS deps
RUN npm ci

# -----------------------------------------------------------------------------
# Development image — hot reload via Node --watch + ts-node/register
# -----------------------------------------------------------------------------
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY src ./src/
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh \
  && npx prisma generate
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "dev:docker"]

# -----------------------------------------------------------------------------
# Build TypeScript for production
# -----------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY src ./src/
RUN npx prisma generate && npm run build

# -----------------------------------------------------------------------------
# Production image — smaller, no devDependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma/
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
