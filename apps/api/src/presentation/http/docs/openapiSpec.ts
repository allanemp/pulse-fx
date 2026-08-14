/**
 * Documento OpenAPI 3.0 servido em `/docs` (Swagger UI) e `/docs/openapi.json`.
 *
 * Mantido como a fonte única da verdade para o contrato HTTP da API — escrito
 * à mão em vez de gerado por anotações espalhadas nos controllers, para que
 * o formato dos schemas fique visível e revisável em um só lugar.
 */

const exchangeRateSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', example: '729f8b62-70f6-480e-9758-c314d429d168' },
    baseCurrency: { type: 'string', minLength: 3, maxLength: 3, example: 'USD' },
    quoteCurrency: { type: 'string', minLength: 3, maxLength: 3, example: 'BRL' },
    rate: { type: 'number', format: 'double', example: 5.42 },
    capturedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'baseCurrency', 'quoteCurrency', 'rate', 'capturedAt'],
};

const createExchangeRateInputSchema = {
  type: 'object',
  properties: {
    baseCurrency: {
      type: 'string',
      minLength: 3,
      maxLength: 3,
      description: 'Código ISO 4217 da moeda base.',
      example: 'USD',
    },
    quoteCurrency: {
      type: 'string',
      minLength: 3,
      maxLength: 3,
      description: 'Código ISO 4217 da moeda de cotação.',
      example: 'BRL',
    },
    rate: { type: 'number', format: 'double', minimum: 0, exclusiveMinimum: true, example: 5.42 },
    capturedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Instante em que a cotação foi observada. Padrão: agora.',
    },
  },
  required: ['baseCurrency', 'quoteCurrency', 'rate'],
};

const apiErrorResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Recurso não encontrado.' },
    details: {
      type: 'object',
      additionalProperties: { type: 'array', items: { type: 'string' } },
      description: 'Presente apenas em erros de validação (400), por campo.',
    },
  },
  required: ['message'],
};

const badRequestResponse = {
  description: 'Dados de entrada inválidos (falha de validação).',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } },
};

const domainErrorResponse = {
  description: 'Violação de regra de negócio.',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } },
};

const notFoundResponse = {
  description: 'Recurso não encontrado.',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } },
};

const currencyQueryParam = (name: string, required: boolean) => ({
  name,
  in: 'query',
  required,
  schema: { type: 'string', minLength: 3, maxLength: 3 },
  example: name === 'baseCurrency' ? 'USD' : 'BRL',
});

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Pulse FX API',
    version: '0.1.0',
    description:
      'API de monitoramento de cotações de câmbio do Pulse FX. Arquitetura em camadas ' +
      '(domain / application / infrastructure / presentation) — este documento cobre apenas ' +
      'o contrato HTTP exposto pela camada de apresentação.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Exchange Rates', description: 'Cotações de câmbio' },
    { name: 'Health', description: 'Verificação de disponibilidade do serviço' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Serviço disponível.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'ok' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/exchange-rates': {
      get: {
        tags: ['Exchange Rates'],
        summary: 'Lista cotações registradas',
        description:
          'Retorna as cotações mais recentes primeiro. Filtro opcional por par de moedas.',
        parameters: [
          currencyQueryParam('baseCurrency', false),
          currencyQueryParam('quoteCurrency', false),
        ],
        responses: {
          '200': {
            description: 'Lista de cotações.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ExchangeRate' } },
              },
            },
          },
          '400': badRequestResponse,
        },
      },
      post: {
        tags: ['Exchange Rates'],
        summary: 'Registra uma nova cotação',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateExchangeRateInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Cotação registrada com sucesso.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ExchangeRate' } },
            },
          },
          '400': badRequestResponse,
          '422': domainErrorResponse,
        },
      },
    },
    '/api/exchange-rates/latest': {
      get: {
        tags: ['Exchange Rates'],
        summary: 'Cotação mais recente de um par de moedas',
        parameters: [
          currencyQueryParam('baseCurrency', true),
          currencyQueryParam('quoteCurrency', true),
        ],
        responses: {
          '200': {
            description: 'Cotação mais recente encontrada.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ExchangeRate' } },
            },
          },
          '400': badRequestResponse,
          '422': notFoundResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      ExchangeRate: exchangeRateSchema,
      CreateExchangeRateInput: createExchangeRateInputSchema,
      ApiErrorResponse: apiErrorResponseSchema,
    },
  },
};
