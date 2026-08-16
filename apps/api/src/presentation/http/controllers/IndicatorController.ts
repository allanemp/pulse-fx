import type { IndicatorDTO } from '@pulse-fx/shared';
import type { Request, Response } from 'express';
import type { MarkIndicatorAsFavoriteInput } from '../../../application/use-cases/MarkIndicatorAsFavorite.js';
import type { RegisterIndicatorInput } from '../../../application/use-cases/RegisterIndicator.js';
import type { UnmarkIndicatorAsFavoriteInput } from '../../../application/use-cases/UnmarkIndicatorAsFavorite.js';
import { createIndicatorSchema, indicatorIdParamSchema } from '../validators/indicator.schema.js';

/**
 * Dependências tipadas pelo FORMATO de `execute`, não pela classe concreta
 * do caso de uso — assim tanto o caso de uso puro quanto uma versão
 * decorada (ex.: `CacheInvalidatingCommand`, ver `composition-root.ts`)
 * servem aqui sem o controller precisar saber que cache existe.
 */
interface RegisterIndicatorUseCase {
  execute(input: RegisterIndicatorInput): Promise<IndicatorDTO>;
}
interface ListIndicatorsUseCase {
  execute(): Promise<IndicatorDTO[]>;
}
interface MarkIndicatorAsFavoriteUseCase {
  execute(input: MarkIndicatorAsFavoriteInput): Promise<void>;
}
interface UnmarkIndicatorAsFavoriteUseCase {
  execute(input: UnmarkIndicatorAsFavoriteInput): Promise<void>;
}

export class IndicatorController {
  constructor(
    private readonly registerIndicator: RegisterIndicatorUseCase,
    private readonly listIndicators: ListIndicatorsUseCase,
    private readonly markIndicatorAsFavorite: MarkIndicatorAsFavoriteUseCase,
    private readonly unmarkIndicatorAsFavorite: UnmarkIndicatorAsFavoriteUseCase,
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
