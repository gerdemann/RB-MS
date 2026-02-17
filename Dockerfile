# Root-level Dockerfile for unified Frontend + Backend deployment
# 
# This Dockerfile builds both frontend and backend into a single image.
# The backend serves the frontend static files via Express.
# 
# Use cases:
# - Docker Compose local development (docker-compose.yml)
# - GitHub Container Registry (GHCR) via GitHub Actions
# - Simple single-container deployments
#
# Note: For Render.com deployment, see backend/Dockerfile which builds
# only the backend (frontend is deployed separately as a static site).

# Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

# Build backend dependencies
FROM node:20-slim AS backend-deps
WORKDIR /app/backend

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma/schema.prisma ./prisma/schema.prisma

RUN npm ci --no-audit --no-fund
RUN npx prisma generate

# Build backend
FROM node:20-slim AS backend-build
WORKDIR /app/backend

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/package.json backend/package-lock.json ./
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src

RUN npm run build

# Final runtime image
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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
