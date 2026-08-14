import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Logger estruturado único para toda a aplicação. Centralizar aqui evita
 * `console.log` espalhado pelo código e permite trocar o transporte
 * (ex.: para um serviço externo) em um só lugar.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
});
