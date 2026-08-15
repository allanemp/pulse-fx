import { z } from 'zod';

export const indicatorIdParamSchema = z.object({
  indicatorId: z.string().uuid('indicatorId deve ser um UUID válido.'),
});

export const createIndicatorSchema = z.object({
  name: z.string().trim().min(1, 'O nome é obrigatório.').max(120),
  unit: z.string().trim().min(1).max(40).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  sourceEndpoint: z.string().trim().min(1).max(300).optional(),
});

export type IndicatorIdParam = z.infer<typeof indicatorIdParamSchema>;
export type CreateIndicatorBody = z.infer<typeof createIndicatorSchema>;
