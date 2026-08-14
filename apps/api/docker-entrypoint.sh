#!/bin/sh
set -e

echo "[pulse-fx-api] Aplicando migrações do banco de dados..."
npx prisma migrate deploy

echo "[pulse-fx-api] Iniciando servidor..."
exec node dist/server.js
