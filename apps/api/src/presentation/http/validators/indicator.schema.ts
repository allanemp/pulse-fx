import { z } from 'zod';

export const createIndicatorSchema = z.object({
  name: z.string().trim().min(1, 'O nome é obrigatório.').max(120),
  sourceEndpoint: z.string().trim().min(1).max(300).optional(),
});

export type CreateIndicatorBody = z.infer<typeof createIndicatorSchema>;
