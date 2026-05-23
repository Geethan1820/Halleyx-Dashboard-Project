# =============================================================================
# Frontend Dockerfile — multi-stage (development + production)
# =============================================================================
# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS deps
RUN npm ci

# -----------------------------------------------------------------------------
# Development — Vite dev server with hot reload (default in docker-compose)
# -----------------------------------------------------------------------------
FROM base AS development
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# -----------------------------------------------------------------------------
# Production build — static assets served by nginx
# -----------------------------------------------------------------------------
FROM base AS build
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
