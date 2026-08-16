import { z } from 'zod';

export const listObservationsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListObservationsQuery = z.infer<typeof listObservationsQuerySchema>;
