import type { Request, Response, NextFunction } from 'express';
import { adminSupabase } from '../db/supabase.js';

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

// Use Supabase's own auth.getUser() for token verification.
// This handles both legacy HS256 tokens and newer asymmetric-signed tokens
// (Supabase migrated newer projects to ES256) without any key management on
// our side. It also validates expiry and revocation.
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

  const { data, error } = await adminSupabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'AUTH_INVALID' });
    return;
  }

  req.user = {
    id: data.user.id,
    ...(data.user.email !== undefined && { email: data.user.email }),
  };
  next();
}
