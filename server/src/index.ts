import express from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { env } from './env.js';
import logger from './lib/logger.js';
import chatRouter from './routes/chat.js';
import chatsRouter from './routes/chats.js';
import { errorHandler } from './middleware/error.js';

const app = express();

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
// Requests carry a Supabase Bearer JWT, so CORS is a secondary line of defence
// rather than the primary one. Tighten the origin to the Azure Static Web Apps
// domain once it is provisioned; for now allow the Vite dev server and, in
// production, lock this via a CLIENT_ORIGIN env var added at deploy time.
app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------
// 64 KB ceiling on request bodies. A chat message that large would exceed the
// context window budget anyway — this just closes a trivial DoS surface.
app.use(express.json({ limit: '64kb' }));

// ---------------------------------------------------------------------------
// Request logging
// ---------------------------------------------------------------------------
// Log method, url, status, and response time only. Never log the request body
// — it contains user message content. CLAUDE.md rule 8: never log message bodies.
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { method: req.method, url: req.url };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
    // SSE routes hold the connection open; don't log them as completed until
    // the stream ends. pino-http does this correctly by default — no extra config.
    customSuccessMessage(req, res) {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
  }),
);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/chat', chatRouter);
app.use('/api/chats', chatsRouter);

// ---------------------------------------------------------------------------
// Error handler (must be last — Express identifies it by 4-argument signature)
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Kanmani server listening');
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
// SIGTERM is sent by Azure App Service and Kubernetes before killing the
// process. We stop accepting new connections and let in-flight requests drain.
// Note: active SSE connections are long-lived; they will be destroyed when the
// process exits. Clients reconnect automatically on next user action.
function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');
  server.close(() => {
    logger.info('HTTP server closed — exiting');
    process.exit(0);
  });
  // Force-exit after 10 s if connections don't drain (SSE streams, etc.)
  setTimeout(() => {
    logger.warn('Forced exit after shutdown timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

export default app;
