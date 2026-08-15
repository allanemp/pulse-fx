#!/bin/sh
set -e

echo "[pulse-fx-api] Aplicando migrações do banco de dados..."
npx prisma migrate deploy

echo "[pulse-fx-api] Populando dados iniciais (seed)..."
# Não usa "set -e" aqui de propósito: o seed depende de rede (API do BCB) e
# é idempotente — se falhar (ex.: sem internet no primeiro boot), a API deve
# subir normalmente mesmo assim. Repita depois com:
#   docker compose exec api node dist/prisma/seed.js
node dist/prisma/seed.js || echo "[pulse-fx-api] Seed falhou (rede indisponível?) — seguindo sem popular dados."

echo "[pulse-fx-api] Iniciando servidor..."
exec node dist/src/server.js
