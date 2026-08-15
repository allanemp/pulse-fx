# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

# ---- build ----
FROM deps AS build
ARG VITE_API_URL=http://localhost:3333
ARG VITE_API_TOKEN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_TOKEN=$VITE_API_TOKEN
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build --workspace @pulse-fx/shared
RUN npm run build --workspace @pulse-fx/web

# ---- runtime: Nginx servindo os arquivos estáticos ----
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1
