# syntax=docker/dockerfile:1.7

# Backend-only Dockerfile for Render.com deployment
#
# This Dockerfile builds ONLY the backend service.
# Used by Render.com where frontend is deployed separately as a static site.
# See render.yaml for the complete Render deployment configuration.
#
# Note: For unified frontend+backend Docker deployments (e.g., Docker Compose),
# see the root-level Dockerfile which combines both services.

FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma

RUN --mount=type=cache,target=/root/.npm \
  npm ci --no-audit --no-fund
RUN --mount=type=cache,target=/root/.cache/prisma \
  npx prisma generate

FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
