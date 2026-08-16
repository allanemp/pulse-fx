/**
 * Documento OpenAPI 3.0 servido em `/docs` (Swagger UI) e `/docs/openapi.json`.
 *
 * Mantido como a fonte única da verdade para o contrato HTTP da API — escrito
 * à mão em vez de gerado por anotações espalhadas nos controllers, para que
 * o formato dos schemas fique visível e revisável em um só lugar.
 */

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

const unauthorizedResponse = {
  description: 'Token de API ausente ou inválido (ver `apiTokenAuth`).',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } },
};

const indicatorSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', example: 'Selic acumulada no mês' },
    unit: {
      type: 'string',
      description: 'Unidade/moeda de exibição do valor.',
      example: '% a.a.',
    },
    description: {
      type: 'string',
      description: 'O que é a série, fonte original (ex.: BCB, FRED) e ressalvas sobre os dados.',
      example:
        'Taxa Selic acumulada no mês, anualizada. Fonte: Banco Central do Brasil (SGS 4390).',
    },
    source: {
      type: 'string',
      enum: ['bcb-sgs', 'bcb-ptax', 'fred'],
      description:
        'Qual IndicatorDataSource sabe sincronizar este indicador. Sempre presente junto com sourceEndpoint, ou ausente junto.',
      example: 'bcb-sgs',
    },
    sourceEndpoint: {
      type: 'string',
      description:
        'Como localizar a série na fonte identificada por "source" — o significado varia por fonte (URL para o SGS, data de início para o PTAX, "series_id:data" para o FRED). Ausente para indicadores sem sincronização automática.',
      example: '/dados/serie/bcdata.sgs.4390/dados?formato=json',
    },
    isFavorite: { type: 'boolean', example: false },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'isFavorite', 'createdAt'],
};

const observationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    indicatorId: { type: 'string', format: 'uuid' },
    date: { type: 'string', format: 'date', example: '2026-08-14' },
    value: { type: 'number', format: 'double', example: 10.75 },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'indicatorId', 'date', 'value', 'createdAt'],
};

const indicatorIdPathParam = {
  name: 'indicatorId',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Pulse FX API',
    version: '0.1.0',
    description:
      'API de monitoramento de indicadores econômicos do Pulse FX. Arquitetura em camadas ' +
      '(domain / application / infrastructure / presentation) — este documento cobre apenas ' +
      'o contrato HTTP exposto pela camada de apresentação.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  security: [{ bearerAuth: [] }],
  tags: [
    {
      name: 'Indicators',
      description: 'Catálogo de indicadores e suas observações (série temporal)',
    },
    { name: 'Health', description: 'Verificação de disponibilidade do serviço' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
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
    '/api/indicators': {
      get: {
        tags: ['Indicators'],
        summary: 'Lista os indicadores cadastrados',
        responses: {
          '200': {
            description: 'Lista de indicadores.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Indicator' } },
              },
            },
          },
          '401': unauthorizedResponse,
        },
      },
    },
    '/api/indicators/{indicatorId}/favorite': {
      put: {
        tags: ['Indicators'],
        summary: 'Marca o indicador como favorito (idempotente)',
        parameters: [indicatorIdPathParam],
        responses: {
          '204': { description: 'Indicador marcado como favorito.' },
          '401': unauthorizedResponse,
          '400': badRequestResponse,
          '422': domainErrorResponse,
        },
      },
      delete: {
        tags: ['Indicators'],
        summary: 'Desmarca o indicador como favorito (idempotente)',
        parameters: [indicatorIdPathParam],
        responses: {
          '204': { description: 'Indicador desmarcado como favorito (ou já não estava).' },
          '401': unauthorizedResponse,
          '400': badRequestResponse,
        },
      },
    },
    '/api/indicators/{indicatorId}/observations': {
      get: {
        tags: ['Indicators'],
        summary: 'Lista a série temporal de observações de um indicador',
        parameters: [
          indicatorIdPathParam,
          {
            name: 'from',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
          { name: 'to', in: 'query', required: false, schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'Lista de observações, ordenadas por data crescente.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Observation' } },
              },
            },
          },
          '401': unauthorizedResponse,
          '400': badRequestResponse,
          '422': notFoundResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      Indicator: indicatorSchema,
      Observation: observationSchema,
      ApiErrorResponse: apiErrorResponseSchema,
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description:
          'Token compartilhado (API_TOKEN) enviado como "Authorization: Bearer <token>".',
      },
    },
  },
};
