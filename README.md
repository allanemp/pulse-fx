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
| Filas           | BullMQ + Redis (sincronização diária de indicadores)           |
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

#### Sincronização automática: `source` + `IndicatorDataSourceRegistry`

Cada indicador sincronizável guarda `source` (ex.: `"bcb-sgs"`,
`"bcb-ptax"`) + `sourceEndpoint` — sempre os dois juntos, ou nenhum
(`Indicator.create` valida isso). `source` diz **qual**
`IndicatorDataSource` sabe interpretar a fonte; `sourceEndpoint` é o dado
que essa implementação específica precisa — o significado varia por fonte,
não é sempre uma URL.

Isso existe porque **indicadores diferentes podem ter fontes com formatos
totalmente diferentes**, mesmo dentro do mesmo órgão. Testamos isso na
prática: o SGS do Banco Central devolve o mesmo formato genérico
`{data, valor}` pra qualquer série (confirmado comparando Selic e IPCA —
séries diferentes, resposta idêntica), mas o PTAX (câmbio) é **outra API do
BCB**, em outro domínio (`olinda.bcb.gov.br`, não `api.bcb.gov.br`), com
formato completamente diferente (OData, cotações aninhadas em `"value"`,
campos `cotacaoCompra`/`cotacaoVenda` em vez de `valor`).

- `IndicatorDataSourceRegistry` (`apps/api/src/infrastructure/gateways`) é
  um dicionário `source -> IndicatorDataSource`. `SyncIndicatorObservations`
  não conhece nenhuma implementação concreta — só pede ao registry a fonte
  certa pro `indicator.source` que está processando.
- `BcbSgsIndicatorDataSource`: `sourceEndpoint` é o complemento de URL,
  combinado em runtime com `BCB_API_BASE_URL` (`.env`/`.env.example`) — o
  mesmo domínio serve qualquer série do SGS.
- `BcbPtaxIndicatorDataSource`: `sourceEndpoint` é a **data de início** da
  série (`YYYY-MM-DD`), não uma URL — o fim do período é recalculado como
  "hoje" a cada chamada, senão a sincronização diária nunca pegaria dado
  novo. Guarda só a cotação de **venda** (`Observation` tem um único
  `value` por data; a de compra fica de fora). O domínio (outro serviço do
  BCB, outro host) fica em `BCB_PTAX_API_BASE_URL` — cada fonte com seu
  próprio domínio configurável, nenhum hardcoded no código.
- Adicionar uma nova fonte é registrar mais uma entrada no dicionário —
  `SyncIndicatorObservations` e o worker da fila não mudam.

Cada `IndicatorDataSource` valida a forma da resposta com Zod antes de
interpretar qualquer coisa — se uma fonte externa mudar de formato, falha
com uma mensagem clara em vez de propagar `NaN`/`Invalid Date` pro banco.

#### Seed: Selic, IPCA e Dólar (PTAX)

Cadastra (ou atualiza, se já existir) três indicadores e sincroniza a série
completa de cada um via `SyncIndicatorObservations`:

| Indicador                    | `source`   | Fonte                                                                                           |
| ---------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Selic acumulada no mês       | `bcb-sgs`  | [SGS 4390](https://dadosabertos.bcb.gov.br/dataset/4390-taxa-de-juros---selic-acumulada-no-mes) |
| IPCA (variação mensal)       | `bcb-sgs`  | SGS 433 (IBGE, via BCB)                                                                         |
| Dólar comercial (PTAX venda) | `bcb-ptax` | Olinda/PTAX (BCB), últimos ~11 anos                                                             |

Upsert por `(indicatorId, date)` — rodar de novo não duplica nem falha.
Script em `apps/api/prisma/seed.ts`.

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

#### Sincronização automática (BullMQ + Redis)

Além do seed manual, todo dia **às 18h (horário de Brasília)** a API
enfileira e sincroniza de novo todos os indicadores que têm `source` e
`sourceEndpoint` configurados (`findSyncable`) — qualquer indicador
cadastrado com os dois entra automaticamente nesse disparo diário, sem
precisar mexer em mais nada além de cadastrá-lo.

- **Fila `indicator-sync`** (`apps/api/src/infrastructure/queue`), dois
  tipos de job:
  - `daily-trigger`: agendado via `Queue.upsertJobScheduler` (cron
    `0 18 * * *`, `tz: America/Sao_Paulo`) — não busca dado nenhum, só
    consulta quais indicadores são sincronizáveis (`ListSyncableIndicatorIds`)
    e enfileira um `sync-indicator` para cada um.
  - `sync-indicator`: roda `SyncIndicatorObservations` para um indicador —
    o mesmo caso de uso usado pelo seed, então a lógica de "como buscar e
    gravar a série de um indicador" existe num único lugar.
- **`concurrency: 1`** de propósito: os indicadores são processados um a
  um, não em paralelo, para nunca disparar requisições simultâneas contra
  a mesma fonte externa (BCB) a partir do mesmo disparo diário.
- O worker roda **dentro do processo da API** (`server.ts` monta o worker
  junto com o Express) — não é um serviço separado. Simplifica o deploy
  nesta fase do projeto; separar em um worker próprio é o próximo passo
  natural se o volume de indicadores justificar.
- `upsertJobScheduler` é idempotente: reiniciar a API não duplica o
  agendamento, só garante que ele existe.

Variável de ambiente: `REDIS_URL` (default `redis://localhost:6379`, já
configurado como `redis://redis:6379` no Docker Compose).

Redis não é um serviço web — não dá pra abrir `localhost:6379` no
navegador. Pra inspecionar as chaves (ex.: ver os jobs da fila), suba a UI
opcional:

```bash
docker compose up -d redis-commander
```

Interface em http://localhost:8081. Não sobe com `docker compose up`
normal (`profiles: ["tools"]`) — só quando pedido explicitamente, pra não
engordar o setup padrão.

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
manual do usuário final. Duas seções empilhadas na mesma página (sem
router — app pequeno o suficiente pra não precisar de rotas ainda):
**"Meus Indicadores Favoritos"** (só os marcados, com estado vazio próprio)
e **"Indicadores"** (todos). As duas leem a mesma query do TanStack Query
(`useIndicators`) — favoritar num card atualiza as duas na hora, sem
requisição extra. A grade de cards + modal (`IndicatorCardsGrid`) é
compartilhada entre as duas seções, não duplicada.

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
- Redis: localhost:6379 (fila de sincronização de indicadores)

### Opção 2 — Ambiente local (sem Docker para api/web)

Requer Node.js 20+, um PostgreSQL e um Redis acessíveis (pode usar
`docker compose up postgres redis` para subir só os dois). Sem Redis a API
sobe normalmente — só a fila de sincronização de indicadores fica sem
efeito até o Redis estar disponível.

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
