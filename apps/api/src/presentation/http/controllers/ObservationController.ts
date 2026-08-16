import type { ObservationDTO } from '@pulse-fx/shared';
import type { Request, Response } from 'express';
import type { ListObservationsInput } from '../../../application/use-cases/ListObservations.js';
import { indicatorIdParamSchema } from '../validators/indicator.schema.js';
import { listObservationsQuerySchema } from '../validators/observation.schema.js';

/** Ver o comentário equivalente em `IndicatorController.ts`: tipado pelo formato de `execute`, não pela classe concreta. */
interface ListObservationsUseCase {
  execute(input: ListObservationsInput): Promise<ObservationDTO[]>;
}

export class ObservationController {
  constructor(private readonly listObservations: ListObservationsUseCase) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { indicatorId } = indicatorIdParamSchema.parse(req.params);
    const query = listObservationsQuerySchema.parse(req.query);

    const observations = await this.listObservations.execute({ indicatorId, ...query });

    res.status(200).json(observations);
  };
}
