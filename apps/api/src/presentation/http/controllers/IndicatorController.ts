import type { Request, Response } from 'express';
import type { ListIndicators } from '../../../application/use-cases/ListIndicators.js';
import type { MarkIndicatorAsFavorite } from '../../../application/use-cases/MarkIndicatorAsFavorite.js';
import type { RegisterIndicator } from '../../../application/use-cases/RegisterIndicator.js';
import type { UnmarkIndicatorAsFavorite } from '../../../application/use-cases/UnmarkIndicatorAsFavorite.js';
import { createIndicatorSchema, indicatorIdParamSchema } from '../validators/indicator.schema.js';

export class IndicatorController {
  constructor(
    private readonly registerIndicator: RegisterIndicator,
    private readonly listIndicators: ListIndicators,
    private readonly markIndicatorAsFavorite: MarkIndicatorAsFavorite,
    private readonly unmarkIndicatorAsFavorite: UnmarkIndicatorAsFavorite,
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

  markFavorite = async (req: Request, res: Response): Promise<void> => {
    const { indicatorId } = indicatorIdParamSchema.parse(req.params);

    await this.markIndicatorAsFavorite.execute({ indicatorId });

    res.status(204).send();
  };

  unmarkFavorite = async (req: Request, res: Response): Promise<void> => {
    const { indicatorId } = indicatorIdParamSchema.parse(req.params);

    await this.unmarkIndicatorAsFavorite.execute({ indicatorId });

    res.status(204).send();
  };
}
