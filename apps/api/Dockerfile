# syntax=docker/dockerfile:1

# Build de múltiplos estágios — a imagem final não carrega devDependencies
# nem o código-fonte TypeScript, apenas o JS compilado e o necessário para
# rodar em produção.

FROM node:20-alpine AS base
# O Prisma (query/schema engine) precisa do OpenSSL disponível no sistema;
# a imagem node:20-alpine não o inclui por padrão.
RUN apk add --no-cache openssl
WORKDIR /app

# ---- deps: instala dependências usando o cache de camadas do Docker ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
# O postinstall do apps/api roda "prisma generate", que precisa do schema
# disponível já nesta etapa (senão falha por não achar prisma/schema.prisma).
COPY apps/api/prisma apps/api/prisma
RUN npm ci

# ---- build: compila o pacote compartilhado e a API ----
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @pulse-fx/shared
RUN npm run prisma:generate --workspace @pulse-fx/api
RUN npm run build --workspace @pulse-fx/api
RUN npm prune --omit=dev

# ---- runtime: imagem final, enxuta ----
FROM base AS runtime
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

RUN chmod +x ./apps/api/docker-entrypoint.sh && \
    chown -R node:node /app
USER node

WORKDIR /app/apps/api
EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3333/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
