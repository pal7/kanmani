import pino from 'pino';
import { env } from '../env.js';

const isDev = env.NODE_ENV !== 'production';

const logger = pino({
  level: isDev ? 'debug' : 'info',
  // In production, emit raw JSON so log aggregators (Azure Monitor, Datadog)
  // can parse structured fields. In development, pino-pretty makes it readable.
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  // Redact any field that could carry secrets or PII. Request/response bodies
  // are never logged (enforced in index.ts via pino-http serializer), but this
  // catches anything accidentally passed as log context.
  redact: {
    paths: ['*.password', '*.token', '*.secret', '*.key', '*.authorization'],
    censor: '[REDACTED]',
  },
});

export default logger;
