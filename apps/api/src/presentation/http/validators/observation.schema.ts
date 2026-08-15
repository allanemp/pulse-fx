import { z } from 'zod';

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

export type CreateObservationBody = z.infer<typeof createObservationSchema>;
export type ListObservationsQuery = z.infer<typeof listObservationsQuerySchema>;
