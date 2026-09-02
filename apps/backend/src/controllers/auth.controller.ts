import { Router, Request, Response } from 'express';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../validations/auth.js';
import { generateCsrfToken, csrfIssue } from '../middlewares/csrf.js';
import { asyncHandler } from '../middlewares/async-handler.js';

const router = Router();

function isSecureCookies(): boolean {
  if (env.COOKIE_SECURE !== undefined) return String(env.COOKIE_SECURE) === 'true';
  return env.NODE_ENV === 'production';
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureCookies(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 1000,
  };
}

function getCsrfCookieOptions() {
  return {
    httpOnly: false,
    secure: isSecureCookies(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 1000,
  };
}

router.post('/login', validate(loginSchema, 'body'), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID) {
    throw new AppError(500, 'Authentication not configured');
  }

  const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

  try {
    const cmd = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const result = await client.send(cmd);
    const idToken = result.AuthenticationResult?.IdToken;

    if (!idToken) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Ensure user exists in DB for FK constraints (owner/assignee)
    try {
      const payload = jwt.decode(idToken) as { sub?: string; email?: string; name?: string } | null;
      if (payload?.sub) {
        await prisma.user.upsert({
          where: { id: payload.sub },
          update: { email: payload.email ?? email, name: payload.name },
          create: { id: payload.sub, email: payload.email ?? email, name: payload.name },
        });
      }
    } catch {
      // Non-blocking: log and continue (task creation will still fail if user missing)
      console.warn('[auth] Failed to upsert user after login');
    }

    const csrfToken = generateCsrfToken();

    res.cookie('id_token', idToken, getCookieOptions());
    res.cookie('csrf_token', csrfToken, getCsrfCookieOptions());

    res.json({ data: { csrfToken } });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    const typed = err as { name?: string; message?: string };
    const map: Record<string, string> = {
      UserNotFoundException: 'No account found with this email.',
      NotAuthorizedException: 'Incorrect email or password.',
      UserNotConfirmedException: 'Please confirm your account first.',
      LimitExceededException: 'Too many attempts. Please try again later.',
    };
    const msg = map[typed.name ?? ''] ?? typed.message ?? 'Invalid credentials';
    throw new AppError(401, msg);
  }
}));

router.post('/logout', (_req: Request, res: Response) => {
  const opts = { path: '/', secure: isSecureCookies(), sameSite: 'lax' as const };
  res.clearCookie('id_token', { ...opts, httpOnly: true });
  res.clearCookie('csrf_token', { ...opts, httpOnly: false });
  res.status(204).send();
});

router.get('/csrf', csrfIssue);

export { router as authRoutes };
