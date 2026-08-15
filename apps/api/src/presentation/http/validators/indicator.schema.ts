import { z } from 'zod';
import { INDICATOR_SOURCES } from '../../../domain/gateways/IndicatorSources.js';

export const indicatorIdParamSchema = z.object({
  indicatorId: z.string().uuid('indicatorId deve ser um UUID válido.'),
});

const indicatorSourceValues = Object.values(INDICATOR_SOURCES) as [string, ...string[]];

export const createIndicatorSchema = z
  .object({
    name: z.string().trim().min(1, 'O nome é obrigatório.').max(120),
    unit: z.string().trim().min(1).max(40).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    source: z.enum(indicatorSourceValues).optional(),
    sourceEndpoint: z.string().trim().min(1).max(300).optional(),
  })
  .refine((body) => Boolean(body.source) === Boolean(body.sourceEndpoint), {
    message: 'source e sourceEndpoint devem ser informados juntos, ou nenhum dos dois.',
    path: ['source'],
  });

export type IndicatorIdParam = z.infer<typeof indicatorIdParamSchema>;
export type CreateIndicatorBody = z.infer<typeof createIndicatorSchema>;
