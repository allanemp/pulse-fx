# Pulse FX

Monorepo de referência para monitoramento de cotações de câmbio, construído como
código de produção (não uma prova de conceito): frontend React, API Node.js em
arquitetura em camadas, PostgreSQL e execução via Docker Compose.

## Stack

| Camada          | Tecnologia                                                     |
| --------------- | -------------------------------------------------------------- |
| Frontend        | React 18 + TypeScript + Vite + TanStack Query + TailwindCSS    |
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
│           ├── utils/            # Funções puras (ex.: cálculo de variação de indicador)
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
expõe um domínio simples de **cotações de câmbio**.

**Só existe na API — sem UI no frontend.** O usuário final não cadastra nem
edita dados na mão em nenhum domínio deste projeto; tudo chega via
integração com fontes externas, como o seed do BCB descrito mais abaixo. A
rota `POST /api/exchange-rates` fica disponível para uma futura integração
automática seguir o mesmo padrão.

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

| Método | Rota                                                   | Descrição                                           |
| ------ | ------------------------------------------------------ | --------------------------------------------------- |
| POST   | `/api/indicators`                                      | Cadastra um novo indicador                          |
| GET    | `/api/indicators`                                      | Lista os indicadores cadastrados (com `isFavorite`) |
| PUT    | `/api/indicators/{indicatorId}/favorite`               | Marca o indicador como favorito (idempotente)       |
| DELETE | `/api/indicators/{indicatorId}/favorite`               | Desmarca o indicador como favorito (idempotente)    |
| POST   | `/api/indicators/{indicatorId}/observations`           | Registra uma observação (data + valor)              |
| GET    | `/api/indicators/{indicatorId}/observations?from=&to=` | Lista a série temporal (filtro opcional por data)   |
| GET    | `/api/indicators/{indicatorId}/observations/latest`    | Observação mais recente do indicador                |

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

Cada indicador pode guardar seu próprio `sourceEndpoint` — o complemento de
URL numa fonte externa (ex.: `/dados/serie/bcdata.sgs.4390/dados?formato=json`
no SGS do Banco Central), combinado em runtime com o domínio base
configurado em `BCB_API_BASE_URL` (`.env`/`.env.example`). O domínio fica no
env porque é o mesmo para qualquer indicador dessa fonte; o complemento fica
no banco porque cada indicador tem o seu.

#### Seed: Selic acumulada no mês

Cadastra (ou atualiza, se já existir) o indicador "Selic acumulada no mês" e
busca a série completa em `BCB_API_BASE_URL` + `source_endpoint`
(dados abertos do Banco Central — [SGS 4390](https://dadosabertos.bcb.gov.br/dataset/4390-taxa-de-juros---selic-acumulada-no-mes)),
fazendo upsert de cada observação por `(indicatorId, date)` — rodar de novo
não duplica nem falha. Script em `apps/api/prisma/seed.ts`.

- **Docker Compose**: roda sozinho a cada início do container `api`
  (`docker-entrypoint.sh`, depois das migrações). Falha de rede no seed
  (ex.: sem internet no primeiro boot) não impede a API de subir — só fica
  sem dados até você rodar de novo. `seed.ts` é compilado para JS no build
  (`dist/prisma/seed.js`) especificamente para rodar só com `node`, sem
  `tsx` (dependência de desenvolvimento, fora da imagem de produção). Para
  rodar de novo manualmente:
  ```bash
  docker compose exec api node dist/prisma/seed.js
  ```
- **Ambiente local (sem Docker)**:
  ```bash
  npm run prisma:seed --workspace apps/api
  ```

#### Favoritos

`favorites` marca indicadores como favoritos — sem sistema de usuários no
projeto, é um estado global por indicador (a existência da linha já é o
"favoritado"), não por usuário. `ListIndicators` resolve `isFavorite` numa
única consulta extra (sem N+1), não como propriedade da entidade
`Indicator` — favoritar não é um fato sobre o indicador em si, é sobre outra
tabela.

### Dashboard: cards de indicadores (TailwindCSS)

O frontend é só leitura: os cards de indicadores (TailwindCSS v4, via
plugin do Vite) são a única tela — sem formulário de cadastro, sem tabela
de cotações. Todo dado vem de integração (seed/API), nunca de digitação
manual do usuário final.

- **Card**: nome, unidade, valor mais recente, data e variação percentual
  vs. a observação anterior (verde alta / vermelho baixa), com botão de
  favoritar (★/☆) que atualiza a lista de forma otimista.
- **Clique no card**: abre um modal com a descrição/fonte do indicador e a
  tabela histórica completa (`GET .../observations`) — a mesma query já
  usada para calcular a variação do card, então abrir o modal não refaz o
  fetch (cache compartilhado do TanStack Query).
- **Rodapé fixo**: aviso de que os dados têm fins educacionais/informativos,
  visível em toda a aplicação.

Optei por **tabela** em vez de gráfico na visão de detalhes para não
introduzir uma biblioteca de charts nesta entrega — dá pra trocar depois se
fizer sentido.

### Documentação interativa (Swagger)

Com a API rodando, o contrato HTTP completo (rotas, schemas, exemplos) está
disponível em:

- **Swagger UI**: http://localhost:3333/docs
- **OpenAPI JSON** (para importar no Postman/Insomnia): http://localhost:3333/docs/openapi.json

O documento fica em `apps/api/src/presentation/http/docs/openapiSpec.ts` — é
código, não gerado a partir de comentários espalhados pelos controllers,
então revisar o contrato é revisar esse arquivo.

## Segurança

Duas camadas, cada uma cobrindo o que a outra não cobre:

- **CORS** (`CORS_ORIGIN`): a API só inclui os cabeçalhos de CORS para a
  origem configurada — qualquer outro site que tente chamar a API a partir
  do JS de um navegador é bloqueado pelo próprio navegador (a API responde,
  mas o JS da página não consegue ler a resposta).
- **Token de API** (`API_TOKEN`): toda rota sob `/api/*` exige
  `Authorization: Bearer <token>` (ver
  `apps/api/src/presentation/http/middlewares/apiTokenAuth.ts`). Sem
  default — a API se recusa a subir sem um valor configurado. `/health` e
  `/docs` continuam públicas.

**Importante**: o frontend é uma SPA pública, então `VITE_API_TOKEN` é
embutido no bundle JS em build time e é extraível por qualquer pessoa que
abra o DevTools ou inspecione os arquivos servidos — **não é um segredo
real**. Isso barra scraping casual e chamadas de terceiros que não olharam
o código, mas não é autenticação de usuário nem impede alguém que copiou o
token de chamar a API diretamente (o que também contorna o CORS, já que
CORS só é aplicado pelo navegador). Para autenticação de verdade, seria
necessário login por usuário (sessão/JWT) ou um backend-for-frontend que
guarde o segredo do lado do servidor — fora do escopo atual.

`API_TOKEN` (backend) e `VITE_API_TOKEN` (build do frontend) precisam ter o
mesmo valor — no Docker Compose, ambos vêm da única variável `API_TOKEN` do
`.env` da raiz. Gere um valor novo por ambiente com `openssl rand -hex 32`.

## Como rodar

### Opção 1 — Docker Compose (recomendado)

Sobe PostgreSQL, API e frontend. A API aplica as migrações do Prisma e roda
o seed do indicador Selic automaticamente ao iniciar (requer rede para
acessar a API do BCB — se falhar, a API sobe do mesmo jeito, só sem dados;
veja "Seed" acima para rodar de novo manualmente).

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173 — é essa a URL que você abre no navegador
- API: http://localhost:3333 (usada pelo frontend; `/docs` tem o Swagger)
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
npm run prisma:seed --workspace apps/api      # opcional: popula o indicador Selic

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
