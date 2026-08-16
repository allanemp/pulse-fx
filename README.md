# Pulse FX

Monorepo de referência para monitoramento de indicadores econômicos e câmbio,
construído como código de produção (não uma prova de conceito): frontend
React, API Node.js em arquitetura em camadas, PostgreSQL e execução via
Docker Compose.

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
  negócio puras (ex.: `source` e `sourceEndpoint` de um indicador só podem
  vir juntos, nunca um sem o outro) e as _interfaces_ (portas) que a
  aplicação usa para persistência — ex.: `IndicatorRepository`.
- **`application`** contém os casos de uso (`ListIndicators`,
  `ListObservations`, `SyncIndicatorObservations`, `MarkIndicatorAsFavorite`).
  Cada caso de uso recebe suas dependências por injeção de construtor e
  depende apenas de abstrações do domínio (Dependency Inversion Principle) —
  por isso são testáveis sem banco de dados (veja `apps/api/test/unit`).
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

- **`api/indicatorsApi.ts`** contém só as funções de acesso HTTP puras.
- **`hooks/useIndicators.ts`**, **`hooks/useObservations.ts`** e
  **`hooks/useToggleFavorite.ts`** envolvem essas funções em
  `useQuery`/`useMutation`, cada um responsável por um único caso de uso da
  tela.
- O cache de leitura é compartilhado automaticamente entre componentes (sem
  refetch redundante) e favoritar/desfavoritar atualiza a lista sozinha via
  `queryClient.invalidateQueries` (com atualização otimista — ver
  `useToggleFavorite.ts`), sem gerenciar `loading`/`error` à mão.
- `app/queryClient.ts` centraliza a configuração do cache (`staleTime`, retries).
  Em desenvolvimento, o React Query Devtools fica disponível na tela (removido
  do bundle de produção por tree-shaking).

### Indicadores

`indicators` é o catálogo (ex.: Selic, IPCA, Fed Funds Rate) e `observations`
é a série temporal de valores de cada indicador, um por data
(`@@unique([indicatorId, date])` no Prisma).

Não há endpoint de escrita manual — o usuário final não cadastra nem edita
dados na mão em nenhum domínio deste projeto; tudo chega via sincronização
automática com as fontes externas (BCB, FRED — ver seed e sincronização
diária mais abaixo). A API expõe só o necessário para o dashboard:

| Método | Rota                                                   | Descrição                                           |
| ------ | ------------------------------------------------------ | --------------------------------------------------- |
| GET    | `/api/indicators`                                      | Lista os indicadores cadastrados (com `isFavorite`) |
| PUT    | `/api/indicators/{indicatorId}/favorite`               | Marca o indicador como favorito (idempotente)       |
| DELETE | `/api/indicators/{indicatorId}/favorite`               | Desmarca o indicador como favorito (idempotente)    |
| GET    | `/api/indicators/{indicatorId}/observations?from=&to=` | Lista a série temporal (filtro opcional por data)   |
| GET    | `/health`                                              | Health check                                        |

`Observation.value` aceita números negativos — indicadores econômicos
legitimamente assumem valores negativos (ex.: variação do PIB).

#### Regra de variação % e janela de histórico por tipo de série

Cada indicador guarda `frequency` (`"daily"` ou `"monthly"` — ver
`IndicatorFrequency`), obrigatório, definido no seed. Não é só metadado: é
o que justifica duas decisões de negócio explícitas.

**Variação %** (`computeLatestChange`, `apps/web/src/utils/indicatorChange.ts`):
compara o valor mais recente com **a observação imediatamente anterior**
salva no banco — ou seja, N=1, sempre. Isso só é uma regra correta (e não
um acidente) porque cada linha já representa o período natural da própria
fonte:

- **Mensal** (Selic, IPCA, CPI, desemprego): a fonte publica uma linha por
  mês — "a linha anterior" já É "o mês anterior". Comparar com N=1 mês é
  literalmente como o IPCA é noticiado oficialmente (variação mês a mês).
- **Diário** (PTAX, Fed Funds Rate, Treasury 10 anos, índice do dólar): o
  BCB e a maioria das séries do FRED só publicam em dia útil — sem linha
  nenhuma no fim de semana, então "a linha anterior" já É "o dia útil
  anterior", sem precisar filtrar nada. **Exceção conferida**: o Fed Funds
  Rate (FRED, série DFF) é a única que replica o valor em fins de semana
  (repete sexta no sábado/domingo) — comparar segunda-feira com domingo dá
  numericamente o mesmo resultado que comparar com sexta, porque o valor
  replicado é idêntico. Nenhuma interpolação é feita em lugar nenhum — se
  não há dado, não há linha, e ponto (regra simples, sem inventar valor).
- **Denominador**: `(atual - anterior) / |anterior|`, com `anterior === 0`
  tratado como "sem variação calculável" (`changePercent: null`) em vez de
  divisão por zero.
- **Data de referência** exibida é sempre a data da observação (`date`),
  nunca a hora em que o dashboard foi carregado.
- **Consistência dashboard/detalhe**: hoje a variação % só aparece nos
  cards do dashboard — o modal de detalhamento ainda não duplica esse
  número (mostra mínimo/máximo do período, não a variação vs. o ponto
  anterior). Ficou registrado aqui como próximo passo, não escondido.

**Janela de histórico** (`periodOptionsForFrequency`,
`apps/web/src/utils/indicatorStats.ts`) muda de acordo com a mesma
`frequency`, em vez de um período genérico igual pra tudo:

| `frequency` | Opções no gráfico | Por quê                                                                 |
| ----------- | ------------------ | ------------------------------------------------------------------------ |
| `daily`     | 30 dias / 12 meses | Resolução diária tem pontos de sobra pras duas janelas.                 |
| `monthly`   | 12 meses / 5 anos  | "30 dias" mostraria 0 ou 1 ponto num indicador mensal — não serve.      |

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
- `FredIndicatorDataSource`: primeira fonte fora do BCB — FRED (Federal
  Reserve Economic Data, EUA). Confirma que o registry aguenta uma API de
  verdade diferente: exige `api_key` por requisição (BCB é aberto,
  `FRED_API_KEY` no `.env` — gratuita em
  https://fredaccount.stlouisfed.org/apikeys), e `value` vem como **string**
  (ex.: `"3.6300000000"`), com `"."` representando dado ausente. Aqui
  `sourceEndpoint` é `"{series_id}:{data_de_início}[:{units}]"` (ex.:
  `"DFF:2015-01-01"` ou `"CPIAUCSL:2015-01-01:pch"`) — precisa do
  `series_id` porque o FRED tem milhares de séries diferentes atrás do
  mesmo formato, diferente do PTAX (uma série fixa). `units` é o parâmetro
  de transformação do próprio FRED — usado para pedir o CPI já como
  variação % mês a mês em vez do índice bruto, comparável ao IPCA, sem
  reimplementar essa conta aqui.
- Adicionar uma nova fonte é registrar mais uma entrada no dicionário —
  `SyncIndicatorObservations` e o worker da fila não mudam.

Cada `IndicatorDataSource` valida a forma da resposta com Zod antes de
interpretar qualquer coisa — se uma fonte externa mudar de formato, falha
com uma mensagem clara em vez de propagar `NaN`/`Invalid Date` pro banco.

#### Seed: BCB (Selic, IPCA, Dólar) e FRED (EUA)

Cadastra (ou atualiza, se já existir) oito indicadores e sincroniza a série
completa de cada um via `SyncIndicatorObservations`:

| Indicador                              | `source`   | `frequency` | Fonte                                                                                            |
| --------------------------------------- | ---------- | ----------- | -------------------------------------------------------------------------------------------------- |
| Selic acumulada no mês                 | `bcb-sgs`  | `monthly`   | [SGS 4390](https://dadosabertos.bcb.gov.br/dataset/4390-taxa-de-juros---selic-acumulada-no-mes) |
| IPCA (variação mensal)                 | `bcb-sgs`  | `monthly`   | SGS 433 (IBGE, via BCB)                                                                          |
| Dólar comercial (PTAX venda)           | `bcb-ptax` | `daily`     | Olinda/PTAX (BCB), últimos ~11 anos                                                              |
| Fed Funds Rate (EUA)                   | `fred`     | `daily`     | FRED, série [DFF](https://fred.stlouisfed.org/series/DFF), últimos ~11 anos                     |
| CPI americano (variação mensal)        | `fred`     | `monthly`   | FRED, série [CPIAUCSL](https://fred.stlouisfed.org/series/CPIAUCSL) (`units=pch`), pares com o IPCA |
| Treasury 10 anos (EUA)                 | `fred`     | `daily`     | FRED, série [DGS10](https://fred.stlouisfed.org/series/DGS10)                                   |
| Índice do dólar (trade-weighted, EUA)  | `fred`     | `daily`     | FRED, série [DTWEXBGS](https://fred.stlouisfed.org/series/DTWEXBGS)                             |
| Taxa de desemprego (EUA)               | `fred`     | `monthly`   | FRED, série [UNRATE](https://fred.stlouisfed.org/series/UNRATE)                                 |

Os indicadores do FRED só sincronizam se `FRED_API_KEY` estiver configurada
— sem ela, `FredIndicatorDataSource` falha só para esses quatro (os do BCB
seguem normalmente).

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

#### Cache de leitura (Redis)

`GET /api/indicators` e `GET /api/indicators/{id}/observations` — os dois
endpoints mais consultados pelo dashboard (toda carga da tela, todo card,
todo modal de detalhes) — passam por um cache-aside em Redis antes de bater
no Postgres, via dois decorators reaproveitáveis em
`infrastructure/cache/`:

- **`CachedQuery`** / **`CachedQueryWithInput`**: envolvem um caso de uso de
  leitura (`ListIndicators`, `ListObservations`) — no cache miss, executam
  o caso de uso real e guardam o resultado (JSON, TTL de
  `CACHE_TTL_SECONDS`, default 300s); no cache hit, devolvem direto do
  Redis, sem tocar no banco.
- **`CacheInvalidatingCommand`**: envolve um caso de uso de escrita
  (`MarkIndicatorAsFavorite`, `UnmarkIndicatorAsFavorite`,
  `SyncIndicatorObservations`) — depois que a
  escrita termina com sucesso, invalida (`SCAN` + `DEL`, nunca `KEYS` —
  não bloqueia o Redis) só o prefixo de cache que aquela escrita afetou.
  Favoritar um indicador invalida `indicators:list`; sincronizar um
  indicador invalida só `observations:{indicatorId}:*` — os demais
  indicadores em cache não são tocados.

O TTL existe como rede de segurança (ex.: se uma invalidação falhar por
algum motivo), não como o mecanismo principal de correção — a invalidação
explícita já mantém o cache correto na prática. Falha do Redis (fora do
ar, indisponível) nunca derruba a API: `RedisCache` devolve cache miss e
segue pro banco normalmente, só logando um aviso.

Os dois decorators são genéricos e tipados pelo formato de `execute()`, não
pela classe concreta do caso de uso — controllers e o worker da fila
dependem só desse formato (`{ execute(input): Promise<Output> }`), então
não sabem (nem precisam saber) que existe cache por trás. Só o
`composition-root.ts` decide o que é cacheado.

Variável de ambiente: `CACHE_TTL_SECONDS` (default `300`).

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

## Deploy em produção (Cloudflare Tunnel)

`docker-compose.prod.yml` é o compose de produção, pensado pra um único
servidor Linux. Diferenças em relação ao `docker-compose.yml` de
desenvolvimento:

- **Nenhuma porta é publicada no host** — nem Postgres, nem Redis, nem a API,
  nem o front. Todos os serviços só se enxergam pela rede interna do
  compose (`internal`).
- Quem expõe o app pra internet é o container `cloudflared`: ele abre uma
  conexão de saída até a Cloudflare (por isso não precisa liberar 80/443 no
  servidor nem no roteador) e a Cloudflare encaminha as requisições públicas
  pra ele, que repassa pros containers `api`/`web` pelo nome do serviço
  (`http://api:3333`, `http://web:80`). Esse mecanismo se chama **Cloudflare
  Tunnel**.

### 1. Criar o túnel na Cloudflare

Pré-requisito: o domínio já precisa estar usando os nameservers da
Cloudflare (plano gratuito serve).

1. No [dashboard da Cloudflare](https://one.dash.cloudflare.com/) vá em
   **Zero Trust → Networks → Tunnels → Create a tunnel**.
2. Escolha **Cloudflared**, dê um nome (ex.: `pulse-fx`) e selecione o
   ambiente **Docker** — a Cloudflare mostra um comando com um token longo;
   copie só o valor do token (depois de `--token`).
3. Ainda na tela do túnel, em **Public Hostname**, crie duas entradas:
   - `api.seudominio.com` → tipo `HTTP`, URL `api:3333`
   - `app.seudominio.com` → tipo `HTTP`, URL `web:80`

   (o hostname interno bate com o nome do serviço no compose — é assim que o
   `cloudflared` sabe pra qual container mandar cada domínio).

### 2. Configurar o servidor

```bash
cp .env.production.example .env.production
```

Edite `.env.production`:

- `POSTGRES_PASSWORD` / `API_TOKEN` — gere valores novos com `openssl rand -hex 32` (não reaproveite os de desenvolvimento)
- `CORS_ORIGIN=https://app.seudominio.com`
- `VITE_API_URL=https://api.seudominio.com`
- `CLOUDFLARE_TUNNEL_TOKEN` — o token copiado no passo 1

### 3. Subir

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

A API aplica as migrações do Prisma e roda o seed automaticamente ao subir
(mesmo `docker-entrypoint.sh` do desenvolvimento). Depois de alguns segundos
`https://app.seudominio.com` e `https://api.seudominio.com/docs` já devem
responder.

Pra atualizar depois de um `git pull` com mudanças novas:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
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

Roda os testes de `apps/api` (Vitest — 10 arquivos, casos de uso, entidades
e os decorators de cache) e de `apps/web` (Vitest — regra de janela de
histórico por `frequency` e o fallback de `filterByPeriod`) em sequência.

Os testes de unidade dos casos de uso usam repositórios em memória (ex.:
`InMemoryIndicatorRepository`) em vez do PostgreSQL, evidenciando o
desacoplamento entre `application` e `infrastructure`.

## Convenções

- **Commits**: mensagens curtas e descritivas, no imperativo.
- **Branches**: `main` protegida; features em branches próprias e PRs.
- **CI**: `.github/workflows/ci.yml` roda lint, build, migrações e testes a
  cada push/PR.

## Licença

MIT — veja [LICENSE](./LICENSE).
