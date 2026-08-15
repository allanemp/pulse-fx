import type { Request, Response } from 'express';
import type { GetLatestObservation } from '../../../application/use-cases/GetLatestObservation.js';
import type { ListObservations } from '../../../application/use-cases/ListObservations.js';
import type { RegisterObservation } from '../../../application/use-cases/RegisterObservation.js';
import { indicatorIdParamSchema } from '../validators/indicator.schema.js';
import {
  createObservationSchema,
  listObservationsQuerySchema,
} from '../validators/observation.schema.js';

export class ObservationController {
  constructor(
    private readonly registerObservation: RegisterObservation,
    private readonly listObservations: ListObservations,
    private readonly getLatestObservation: GetLatestObservation,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { indicatorId } = indicatorIdParamSchema.parse(req.params);
    const body = createObservationSchema.parse(req.body);

    const observation = await this.registerObservation.execute({ indicatorId, ...body });

    res.status(201).json(observation);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { indicatorId } = indicatorIdParamSchema.parse(req.params);
    const query = listObservationsQuerySchema.parse(req.query);

    const observations = await this.listObservations.execute({ indicatorId, ...query });

    res.status(200).json(observations);
  };

  latest = async (req: Request, res: Response): Promise<void> => {
    const { indicatorId } = indicatorIdParamSchema.parse(req.params);

    const observation = await this.getLatestObservation.execute({ indicatorId });

    res.status(200).json(observation);
  };
}
