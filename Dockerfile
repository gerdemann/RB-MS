# syntax=docker/dockerfile:1.7

# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
  npm ci --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

# Build backend dependencies
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma/schema.prisma ./prisma/schema.prisma

RUN --mount=type=cache,target=/root/.npm \
  npm ci --no-audit --no-fund
RUN --mount=type=cache,target=/root/.cache/prisma \
  npx prisma generate

# Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend

COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/package.json backend/package-lock.json ./
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src

RUN npm run build

# Final runtime image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy backend
COPY backend/package.json backend/package-lock.json ./
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./public

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
