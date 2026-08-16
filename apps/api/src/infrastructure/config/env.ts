import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória.'),
  /** Único domínio autorizado a chamar a API a partir do navegador (ver `cors()` em `app.ts`). */
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  /**
   * Segredo compartilhado que o frontend envia em `Authorization: Bearer <token>`
   * em toda chamada a `/api/*` (ver `apiTokenAuth` middleware). Sem default:
   * a API se recusa a subir sem um valor explícito — um controle de segurança
   * não deve ter um bypass silencioso.
   */
  API_TOKEN: z.string().min(16, 'API_TOKEN deve ter pelo menos 16 caracteres.'),
  /**
   * Domínio base do SGS (Sistema Gerenciador de Séries Temporais) do Banco
   * Central, usado por `BcbSgsIndicatorDataSource` (seed e sincronização
   * diária) para buscar séries de indicadores como Selic e IPCA. O
   * complemento específico de cada série (ex.: `/dados/serie/bcdata.sgs.4390/dados`)
   * fica salvo por indicador em `indicators.source_endpoint`, não aqui.
   */
  BCB_API_BASE_URL: z.string().url().default('https://api.bcb.gov.br'),
  /**
   * Domínio base do PTAX (câmbio) do Banco Central, usado por
   * `BcbPtaxIndicatorDataSource` — API diferente do SGS, em outro domínio,
   * por isso tem sua própria variável em vez de reaproveitar
   * `BCB_API_BASE_URL`.
   */
  BCB_PTAX_API_BASE_URL: z
    .string()
    .url()
    .default('https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata'),
  /** Conexão do Redis usada pela fila BullMQ de sincronização de indicadores. */
  REDIS_URL: z.string().default('redis://localhost:6379'),
  /**
   * Domínio base da API do FRED (Federal Reserve Economic Data, EUA), usado
   * por `FredIndicatorDataSource`. Diferente do BCB, o FRED exige uma
   * `api_key` por requisição (ver `FRED_API_KEY`) — não é uma API aberta.
   */
  FRED_API_BASE_URL: z.string().url().default('https://api.stlouisfed.org/fred'),
  /**
   * Chave da API do FRED (gratuita, uma por conta — https://fredaccount.stlouisfed.org/apikeys).
   * Opcional na config global: só é exigida em tempo de execução se algum
   * indicador estiver cadastrado com `source: "fred"` (ver
   * `FredIndicatorDataSource`) — um deploy sem nenhum indicador do FRED
   * cadastrado não precisa dela.
   */
  FRED_API_KEY: z.string().optional(),
  /**
   * TTL do cache de leitura (Redis) para `GET /api/indicators` e
   * `GET /api/indicators/{id}/observations` — ver `infrastructure/cache`.
   * Funciona como uma rede de segurança: a invalidação explícita (nas
   * escritas) já mantém o cache correto na prática, o TTL só garante que
   * ele nunca fica desatualizado por muito tempo mesmo se alguma
   * invalidação falhar.
   */
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
    throw new Error('Falha ao carregar a configuração da aplicação a partir do ambiente.');
  }

  return parsed.data;
}

/**
 * Configuração da aplicação validada uma única vez na inicialização.
 * Nenhuma outra parte do código deve ler `process.env` diretamente.
 */
export const env = loadEnv();
