import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { AppError } from './error-handler.js';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_BYTES = 32;

// Safe methods don't require CSRF check (OWASP)
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function signToken(token: string): string {
  return crypto.createHmac('sha256', env.CSRF_SECRET).update(token).digest('hex');
}

function generateRawToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_BYTES).toString('hex');
}

export function generateCsrfToken(): string {
  const raw = generateRawToken();
  const sig = signToken(raw);
  return `${raw}.${sig}`;
}

function verifyCsrfToken(token: string): boolean {
  if (!token || !token.includes('.')) return false;
  const [raw, sig] = token.split('.');
  if (!raw || !sig) return false;
  const expected = signToken(raw);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function getCookieOptions() {
  const isSecure = env.COOKIE_SECURE || env.NODE_ENV === 'production';
  return {
    httpOnly: false,
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 1000,
  };
}

export function csrfIssue(req: Request, res: Response, _next: NextFunction): void {
  const existing = req.cookies?.[CSRF_COOKIE_NAME];
  if (existing && verifyCsrfToken(existing)) {
    res.json({ csrfToken: existing });
    return;
  }
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, getCookieOptions());
  res.json({ csrfToken: token });
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  // Skip CSRF in test to keep unit/integration tests frictionless; production enforces.
  if (env.NODE_ENV === 'test') {
    next();
    return;
  }

  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken) {
    throw new AppError(403, 'Invalid CSRF token');
  }

  if (cookieToken !== headerToken) {
    throw new AppError(403, 'Invalid CSRF token');
  }

  if (!verifyCsrfToken(cookieToken)) {
    throw new AppError(403, 'Invalid CSRF token');
  }

  next();
}

export const CSRF_COOKIE = CSRF_COOKIE_NAME;
export const CSRF_HEADER = CSRF_HEADER_NAME;
