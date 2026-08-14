import type { Request, Response } from 'express';
import type { GetLatestExchangeRate } from '../../../application/use-cases/GetLatestExchangeRate.js';
import type { ListExchangeRates } from '../../../application/use-cases/ListExchangeRates.js';
import type { RegisterExchangeRate } from '../../../application/use-cases/RegisterExchangeRate.js';
import {
  createExchangeRateSchema,
  latestExchangeRateQuerySchema,
  listExchangeRatesQuerySchema,
} from '../validators/exchangeRate.schema.js';

/**
 * Controller HTTP: única responsabilidade é traduzir requisição <-> caso de
 * uso <-> resposta. Nenhuma regra de negócio vive aqui — apenas validação de
 * formato de entrada (via zod) e status codes.
 */
export class ExchangeRateController {
  constructor(
    private readonly registerExchangeRate: RegisterExchangeRate,
    private readonly listExchangeRates: ListExchangeRates,
    private readonly getLatestExchangeRate: GetLatestExchangeRate,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createExchangeRateSchema.parse(req.body);

    const exchangeRate = await this.registerExchangeRate.execute(body);

    res.status(201).json(exchangeRate);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = listExchangeRatesQuerySchema.parse(req.query);

    const exchangeRates = await this.listExchangeRates.execute(query);

    res.status(200).json(exchangeRates);
  };

  latest = async (req: Request, res: Response): Promise<void> => {
    const query = latestExchangeRateQuerySchema.parse(req.query);

    const exchangeRate = await this.getLatestExchangeRate.execute(query);

    res.status(200).json(exchangeRate);
  };
}
