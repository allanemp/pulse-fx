import { z } from 'zod';

const currencyCode = z
  .string()
  .trim()
  .length(3, 'Deve conter exatamente 3 letras (padrão ISO 4217).');

export const createExchangeRateSchema = z.object({
  baseCurrency: currencyCode,
  quoteCurrency: currencyCode,
  rate: z.number().positive('A cotação deve ser maior que zero.'),
  capturedAt: z.coerce.date().optional(),
});

export const listExchangeRatesQuerySchema = z.object({
  baseCurrency: currencyCode.optional(),
  quoteCurrency: currencyCode.optional(),
});

export const latestExchangeRateQuerySchema = z.object({
  baseCurrency: currencyCode,
  quoteCurrency: currencyCode,
});

export type CreateExchangeRateBody = z.infer<typeof createExchangeRateSchema>;
export type ListExchangeRatesQuery = z.infer<typeof listExchangeRatesQuerySchema>;
export type LatestExchangeRateQuery = z.infer<typeof latestExchangeRateQuerySchema>;
