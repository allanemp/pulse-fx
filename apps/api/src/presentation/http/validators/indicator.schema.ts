import { z } from 'zod';

export const indicatorIdParamSchema = z.object({
  indicatorId: z.string().uuid('indicatorId deve ser um UUID válido.'),
});

export type IndicatorIdParam = z.infer<typeof indicatorIdParamSchema>;
