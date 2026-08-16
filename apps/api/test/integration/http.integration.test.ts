import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListIndicators } from '../../src/application/use-cases/ListIndicators.js';
import { ListObservations } from '../../src/application/use-cases/ListObservations.js';
import { MarkIndicatorAsFavorite } from '../../src/application/use-cases/MarkIndicatorAsFavorite.js';
import { UnmarkIndicatorAsFavorite } from '../../src/application/use-cases/UnmarkIndicatorAsFavorite.js';
import { Indicator } from '../../src/domain/entities/Indicator.js';
import { INDICATOR_FREQUENCIES } from '../../src/domain/entities/IndicatorFrequency.js';
import { createApp } from '../../src/presentation/http/app.js';
import { IndicatorController } from '../../src/presentation/http/controllers/IndicatorController.js';
import { ObservationController } from '../../src/presentation/http/controllers/ObservationController.js';
import { InMemoryFavoriteRepository } from '../unit/InMemoryFavoriteRepository.js';
import { InMemoryIndicatorRepository } from '../unit/InMemoryIndicatorRepository.js';
import { InMemoryObservationRepository } from '../unit/InMemoryObservationRepository.js';

const API_TOKEN = process.env.API_TOKEN;

if (!API_TOKEN) {
  throw new Error('API_TOKEN não definido — ver env em vitest.integration.config.ts.');
}

/**
 * Teste de integração da camada HTTP — bate na app Express de verdade via
 * `supertest` (requisição HTTP real, não chamada direta de controller),
 * passando pelos middlewares reais (`apiTokenAuth`, `errorHandler`,
 * validação Zod). Usa repositórios em memória (não Postgres) de propósito:
 * o que este teste cobre é "a fiação HTTP funciona", não "o mapeamento do
 * banco funciona" — isso já é responsabilidade do teste de integração do
 * repositório Prisma.
 */
function buildTestApp(): { app: Express; indicatorRepository: InMemoryIndicatorRepository } {
  const indicatorRepository = new InMemoryIndicatorRepository();
  const favoriteRepository = new InMemoryFavoriteRepository();
  const observationRepository = new InMemoryObservationRepository();

  const indicatorController = new IndicatorController(
    new ListIndicators(indicatorRepository, favoriteRepository),
    new MarkIndicatorAsFavorite(favoriteRepository, indicatorRepository),
    new UnmarkIndicatorAsFavorite(favoriteRepository),
  );
  const observationController = new ObservationController(
    new ListObservations(observationRepository, indicatorRepository),
  );

  const app = createApp({ indicatorController, observationController });

  return { app, indicatorRepository };
}

describe('HTTP (integração)', () => {
  let app: Express;
  let indicatorRepository: InMemoryIndicatorRepository;

  beforeEach(() => {
    ({ app, indicatorRepository } = buildTestApp());
  });

  it('GET /health não exige token e responde 200', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /api/indicators sem token responde 401', async () => {
    const response = await request(app).get('/api/indicators');

    expect(response.status).toBe(401);
  });

  it('GET /api/indicators com token errado responde 401', async () => {
    const response = await request(app)
      .get('/api/indicators')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);
  });

  it('GET /api/indicators com token válido lista os indicadores cadastrados', async () => {
    const indicator = Indicator.create({
      name: 'Selic acumulada no mês',
      frequency: INDICATOR_FREQUENCIES.MONTHLY,
    });
    await indicatorRepository.save(indicator);

    const response = await request(app)
      .get('/api/indicators')
      .set('Authorization', `Bearer ${API_TOKEN}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      expect.objectContaining({
        id: indicator.id,
        name: 'Selic acumulada no mês',
        frequency: 'monthly',
        isFavorite: false,
      }),
    ]);
  });

  it('PUT .../favorite marca como favorito, refletido no GET seguinte', async () => {
    const indicator = Indicator.create({
      name: 'IPCA',
      frequency: INDICATOR_FREQUENCIES.MONTHLY,
    });
    await indicatorRepository.save(indicator);

    const putResponse = await request(app)
      .put(`/api/indicators/${indicator.id}/favorite`)
      .set('Authorization', `Bearer ${API_TOKEN}`);

    expect(putResponse.status).toBe(204);

    const getResponse = await request(app)
      .get('/api/indicators')
      .set('Authorization', `Bearer ${API_TOKEN}`);

    expect(getResponse.body).toEqual([expect.objectContaining({ isFavorite: true })]);
  });

  it('PUT .../favorite com indicatorId que não é UUID responde 400 com detalhes', async () => {
    const response = await request(app)
      .put('/api/indicators/id-invalido/favorite')
      .set('Authorization', `Bearer ${API_TOKEN}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBeTruthy();
    expect(response.body.details).toBeTruthy();
  });

  it('rota desconhecida responde 404', async () => {
    const response = await request(app)
      .get('/api/rota-que-nao-existe')
      .set('Authorization', `Bearer ${API_TOKEN}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Recurso não encontrado.' });
  });
});
