import type { Request, Response } from 'express';
import type { ListIndicators } from '../../../application/use-cases/ListIndicators.js';
import type { RegisterIndicator } from '../../../application/use-cases/RegisterIndicator.js';
import { createIndicatorSchema } from '../validators/indicator.schema.js';

export class IndicatorController {
  constructor(
    private readonly registerIndicator: RegisterIndicator,
    private readonly listIndicators: ListIndicators,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createIndicatorSchema.parse(req.body);

    const indicator = await this.registerIndicator.execute(body);

    res.status(201).json(indicator);
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    const indicators = await this.listIndicators.execute();

    res.status(200).json(indicators);
  };
}
