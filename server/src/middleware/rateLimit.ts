import rateLimit from 'express-rate-limit';

// 60 requests per user per minute — applied after authMiddleware so that
// req.user is available as the key. Using user ID rather than IP prevents
// shared-network false positives (e.g. multiple users on the same corporate
// NAT or home router).
export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator(req) {
    // req.user is set by authMiddleware, which must precede this in the chain.
    // Fallback to IP is a safety net; in practice auth always runs first.
    return (req as typeof req & { user?: { id: string } }).user?.id ?? req.ip ?? 'unknown';
  },
  handler(_req, res) {
    res.status(429).json({ error: 'Too many requests — please slow down', code: 'RATE_LIMITED' });
  },
});
