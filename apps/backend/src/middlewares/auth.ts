import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

export interface AuthPayload {
  sub: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = decodeJwtPayload(token);
    req.user = { sub: payload.sub, email: payload.email };
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}

function decodeJwtPayload(token: string): AuthPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  return { sub: payload.sub, email: payload.email };
}
