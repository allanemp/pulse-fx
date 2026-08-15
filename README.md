# Pulse FX

Monorepo de referência para monitoramento de cotações de câmbio, construído como
código de produção (não uma prova de conceito): frontend React, API Node.js em
arquitetura em camadas, PostgreSQL e execução via Docker Compose.

## Stack

| Camada          | Tecnologia                                                     |
| --------------- | -------------------------------------------------------------- |
| Frontend        | React 18 + TypeScript + Vite + TanStack Query                  |
| Backend         | Node.js + TypeScript + Express, arquitetura em camadas (SOLID) |
| Persistência    | PostgreSQL 16 + Prisma ORM                                     |
| Containerização | Docker + Docker Compose                                        |
| Testes          | Vitest                                                         |
| Qualidade       | ESLint + Prettier, workspaces npm                              |

## Estrutura do monorepo

```
pulse-fx/
├── apps/
│   ├── api/                  # Backend Node.js + TypeScript
│   │   └── src/
│   │       ├── domain/           # Entidades, value objects, contratos de repositório, erros de negócio
│   │       ├── application/      # Casos de uso (orquestram o domínio) e DTOs
│   │       ├── infrastructure/   # Prisma, config de ambiente, logger — detalhes técnicos
│   │       ├── presentation/     # Controllers, rotas, middlewares HTTP (Express)
│   │       └── composition-root.ts  # Injeção de dependências (fiação de tudo)
│   └── web/                  # Frontend React + TypeScript (Vite)
│       └── src/
│           ├── api/              # Cliente HTTP, acesso à API e query keys
│           ├── app/              # Configuração do QueryClient (TanStack Query)
│           ├── hooks/            # Hooks de dados (useQuery/useMutation por caso de uso)
│           ├── components/       # Componentes de UI
│           └── pages/            # Páginas
├── packages/
│   └── shared/                # Tipos/DTOs compartilhados entre api e web
├── docker-compose.yml
└── package.json                # Root, workspaces npm
```

### Por que essa organização?

O backend segue **Clean Architecture / arquitetura em camadas**, aplicando
princípios SOLID:

- **`domain`** não depende de nenhuma outra camada. Contém as regras de
  negócio puras (ex.: uma cotação não pode ter valor ≤ 0) e as _interfaces_
  (portas) que a aplicação usa para persistência — ex.: `ExchangeRateRepository`.
- **`application`** contém os casos de uso (`RegisterExchangeRate`,
  `ListExchangeRates`, `GetLatestExchangeRate`). Cada caso de uso recebe suas
  dependências por injeção de construtor e depende apenas de abstrações do
  domínio (Dependency Inversion Principle) — por isso são testáveis sem banco
  de dados (veja `apps/api/test/unit`).
- **`infrastructure`** contém as implementações concretas: o repositório
  Prisma/PostgreSQL, configuração de ambiente validada com Zod e o logger.
  É a única camada que conhece Prisma.
- **`presentation`** contém a fiação HTTP (Express): controllers, rotas,
  validação de entrada (Zod) e o middleware de erro centralizado.
- **`composition-root.ts`** é o único lugar do projeto que instancia
  implementações concretas e as injeta nos casos de uso — trocar Prisma por
  outra tecnologia de persistência afeta apenas esse arquivo e a pasta
  `infrastructure/`.

No frontend, a comunicação com a API passa por **hooks + TanStack Query**
em vez de `useState`/`useEffect` manuais:

- **`api/exchangeRatesApi.ts`** contém só as funções de acesso HTTP puras.
- **`hooks/useExchangeRates.ts`** e **`hooks/useCreateExchangeRate.ts`** envolvem
  essas funções em `useQuery`/`useMutation`, cada um responsável por um único
  caso de uso da tela.
- O cache de leitura é compartilhado automaticamente entre componentes (sem
  refetch redundante) e a listagem se atualiza sozinha após um `POST` bem-sucedido
  via `queryClient.invalidateQueries`, sem gerenciar `loading`/`error` à mão.
- `app/queryClient.ts` centraliza a configuração do cache (`staleTime`, retries).
  Em desenvolvimento, o React Query Devtools fica disponível na tela (removido
  do bundle de produção por tree-shaking).

## Domínio de exemplo

Para servir como esqueleto funcional e não apenas uma casca vazia, a API
expõe um domínio simples de **cotações de câmbio**:

| Método | Rota                                                            | Descrição                                |
| ------ | --------------------------------------------------------------- | ---------------------------------------- |
| POST   | `/api/exchange-rates`                                           | Registra uma nova cotação                |
| GET    | `/api/exchange-rates`                                           | Lista cotações (filtro opcional por par) |
| GET    | `/api/exchange-rates/latest?baseCurrency=USD&quoteCurrency=BRL` | Retorna a cotação mais recente de um par |
| GET    | `/health`                                                       | Health check                             |

Exemplo de corpo do `POST`:

```json
{
  "baseCurrency": "USD",
  "quoteCurrency": "BRL",
  "rate": 5.42
}
```

### Indicadores

Um segundo domínio, em camadas completas (domain → application →
infrastructure → presentation), como o de cotações: `indicators` é o
catálogo (ex.: SELIC, IPCA) e `observations` é a série temporal de valores
de cada indicador, um por data (`@@unique([indicatorId, date])` no Prisma).

| Método | Rota                                                   | Descrição                                         |
| ------ | ------------------------------------------------------ | ------------------------------------------------- |
| POST   | `/api/indicators`                                      | Cadastra um novo indicador                        |
| GET    | `/api/indicators`                                      | Lista os indicadores cadastrados                  |
| POST   | `/api/indicators/{indicatorId}/observations`           | Registra uma observação (data + valor)            |
| GET    | `/api/indicators/{indicatorId}/observations?from=&to=` | Lista a série temporal (filtro opcional por data) |

Exemplo de corpo do `POST /api/indicators/{indicatorId}/observations`:

```json
{
  "date": "2026-08-14",
  "value": 10.75
}
```

Ao contrário de `ExchangeRate.rate`, `Observation.value` aceita números
negativos — indicadores econômicos legitimamente assumem valores negativos
(ex.: variação do PIB).

### Documentação interativa (Swagger)

Com a API rodando, o contrato HTTP completo (rotas, schemas, exemplos) está
disponível em:

- **Swagger UI**: http://localhost:3333/docs
- **OpenAPI JSON** (para importar no Postman/Insomnia): http://localhost:3333/docs/openapi.json

O documento fica em `apps/api/src/presentation/http/docs/openapiSpec.ts` — é
código, não gerado a partir de comentários espalhados pelos controllers,
então revisar o contrato é revisar esse arquivo.

## Como rodar

### Opção 1 — Docker Compose (recomendado)

Sobe PostgreSQL, API e frontend, com a API aplicando as migrações do Prisma
automaticamente ao iniciar.

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:3333
- PostgreSQL: localhost:5432

### Opção 2 — Ambiente local (sem Docker para api/web)

Requer Node.js 20+ e um PostgreSQL acessível (pode usar `docker compose up postgres`
para subir só o banco).

```bash
npm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

npm run build:shared
npm run prisma:migrate --workspace apps/api   # cria/atualiza o banco local

npm run dev:api    # http://localhost:3333
npm run dev:web    # http://localhost:5173 (em outro terminal)
```

## Scripts úteis (raiz)

| Script                  | Descrição                                     |
| ----------------------- | --------------------------------------------- |
| `npm run build`         | Builda `shared`, `api` e `web`, nessa ordem   |
| `npm run test`          | Roda os testes da API (Vitest)                |
| `npm run lint`          | ESLint em todo o monorepo                     |
| `npm run format`        | Formata o código com Prettier                 |
| `npm run typecheck`     | Checagem de tipos em `api` e `web`            |
| `npm run prisma:studio` | Abre o Prisma Studio (`--workspace apps/api`) |
| `npm run docker:up`     | `docker compose up --build`                   |

## Testes

```bash
npm test
```

Os testes de unidade dos casos de uso usam um repositório em memória
(`InMemoryExchangeRateRepository`) em vez do PostgreSQL, evidenciando o
desacoplamento entre `application` e `infrastructure`.

## Convenções

- **Commits**: mensagens curtas e descritivas, no imperativo.
- **Branches**: `main` protegida; features em branches próprias e PRs.
- **CI**: `.github/workflows/ci.yml` roda lint, build, migrações e testes a
  cada push/PR.

## Licença

MIT — veja [LICENSE](./LICENSE).
