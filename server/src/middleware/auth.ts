import type { Request, Response, NextFunction } from 'express';
import { jwtVerify, type JWTPayload } from 'jose';
import { env } from '../env.js';

// Augment the global Express namespace so req.user is typed everywhere.
// @types/express-serve-static-core merges Express.Request into the Request
// interface, so global namespace augmentation is the correct mechanism here —
// pnpm's isolated store doesn't expose express-serve-static-core directly.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}

export interface AuthUser {
  id: string;
  email?: string;
}

// Supabase JWT payload shape. `sub` is the user UUID; `role` must be
// 'authenticated' to distinguish logged-in users from anon keys.
interface SupabaseJwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  role?: string;
}

const JWT_SECRET = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header', code: 'AUTH_MISSING' });
    return;
  }

  const token = header.slice(7);

  try {
    const { payload } = await jwtVerify<SupabaseJwtPayload>(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Reject service-role keys and anon tokens — only real user sessions allowed.
    if (payload.role !== 'authenticated') {
      res.status(401).json({ error: 'Invalid token role', code: 'AUTH_ROLE' });
      return;
    }

    req.user = { id: payload.sub, ...(payload.email !== undefined && { email: payload.email }) };
    next();
  } catch {
    // jwtVerify throws on expired, malformed, or bad-signature tokens.
    // We don't surface the internal error to avoid leaking validation details.
    res.status(401).json({ error: 'Invalid or expired token', code: 'AUTH_INVALID' });
  }
}
