import { z } from 'zod';

export const indicatorIdParamSchema = z.object({
  indicatorId: z.string().uuid('indicatorId deve ser um UUID válido.'),
});

export const createObservationSchema = z.object({
  date: z.coerce.date({
    errorMap: () => ({ message: 'date deve ser uma data válida (YYYY-MM-DD).' }),
  }),
  value: z.number().finite('O valor deve ser um número finito.'),
});

export const listObservationsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type IndicatorIdParam = z.infer<typeof indicatorIdParamSchema>;
export type CreateObservationBody = z.infer<typeof createObservationSchema>;
export type ListObservationsQuery = z.infer<typeof listObservationsQuerySchema>;
