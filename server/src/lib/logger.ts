import pino from 'pino';
import { env } from '../env.js';

const isDev = env.NODE_ENV !== 'production';

const logger = pino({
  level: isDev ? 'debug' : 'info',
  // Redact any field that could carry secrets or PII. Request/response bodies
  // are never logged (enforced in index.ts via pino-http serializer), but this
  // catches anything accidentally passed as log context.
  redact: {
    paths: ['*.password', '*.token', '*.secret', '*.key', '*.authorization'],
    censor: '[REDACTED]',
  },
});

export default logger;
