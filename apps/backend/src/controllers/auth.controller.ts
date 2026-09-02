import { Router, Request, Response } from 'express';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  AdminConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema, changePasswordSchema } from '../validations/auth.js';
import { generateCsrfToken, csrfIssue } from '../middlewares/csrf.js';
import { asyncHandler } from '../middlewares/async-handler.js';
import { authenticate } from '../middlewares/auth.js';

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

async function ensureUserRecord(idToken: string, email: string): Promise<void> {
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
}

function mapAuthError(err: unknown): AppError {
  const typed = err as { name?: string; message?: string };
  const map: Record<string, string> = {
    UserNotFoundException: 'No account found with this email.',
    NotAuthorizedException: 'Incorrect email or password.',
    UserNotConfirmedException: 'Please confirm your account first.',
    UsernameExistsException: 'An account with this email already exists.',
    LimitExceededException: 'Too many attempts. Please try again later.',
    NewPasswordRequiredException: 'You must change your password on first login.',
    InvalidPasswordException: 'Password does not meet the requirements.',
  };
  const msg = map[typed.name ?? ''] ?? typed.message ?? 'Invalid credentials';
  return new AppError(401, msg);
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

    // Temporary password set by an admin → must be changed on first login.
    if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      res.json({ data: { challenge: 'NEW_PASSWORD_REQUIRED', session: result.Session, email } });
      return;
    }

    const idToken = result.AuthenticationResult?.IdToken;

    if (!idToken) {
      throw new AppError(401, 'Invalid credentials');
    }

    await ensureUserRecord(idToken, email);

    const csrfToken = generateCsrfToken();

    res.cookie('id_token', idToken, getCookieOptions());
    res.cookie('csrf_token', csrfToken, getCsrfCookieOptions());

    res.json({ data: { csrfToken } });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw mapAuthError(err);
  }
}));

router.post('/register', validate(registerSchema, 'body'), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body as { email: string; password: string; name?: string | null };

  if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID) {
    throw new AppError(500, 'Authentication not configured');
  }

  const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

  try {
    const userAttributes = [{ Name: 'email', Value: email }];
    if (name) userAttributes.push({ Name: 'name', Value: name });

    await client.send(new SignUpCommand({
      ClientId: env.COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: userAttributes,
    }));

    // No email delivery is configured; auto-confirm the account so sign-up is instant.
    await client.send(new AdminConfirmSignUpCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID,
      Username: email,
    }));

    res.status(201).json({ data: { email } });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    const typed = err as { name?: string; message?: string };
    if (typed.name === 'UsernameExistsException') {
      throw new AppError(409, 'An account with this email already exists.');
    }
    throw new AppError(400, typed.message ?? 'Registration failed');
  }
}));

router.post('/change-password', validate(changePasswordSchema, 'body'), asyncHandler(async (req: Request, res: Response) => {
  const { email, session, newPassword } = req.body as { email: string; session: string; newPassword: string };

  if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID) {
    throw new AppError(500, 'Authentication not configured');
  }

  const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

  try {
    const cmd = new RespondToAuthChallengeCommand({
      ClientId: env.COGNITO_CLIENT_ID,
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: session,
      ChallengeResponses: {
        USERNAME: email,
        NEW_PASSWORD: newPassword,
      },
    });

    const result = await client.send(cmd);
    const idToken = result.AuthenticationResult?.IdToken;

    if (!idToken) {
      throw new AppError(401, 'Failed to set new password');
    }

    await ensureUserRecord(idToken, email);

    const csrfToken = generateCsrfToken();

    res.cookie('id_token', idToken, getCookieOptions());
    res.cookie('csrf_token', csrfToken, getCsrfCookieOptions());

    res.json({ data: { csrfToken } });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw mapAuthError(err);
  }
}));

router.post('/logout', (_req: Request, res: Response) => {
  const opts = { path: '/', secure: isSecureCookies(), sameSite: 'lax' as const };
  res.clearCookie('id_token', { ...opts, httpOnly: true });
  res.clearCookie('csrf_token', { ...opts, httpOnly: false });
  res.status(204).send();
});

router.get('/csrf', csrfIssue);

router.get('/me', authenticate, (req, res) => {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  res.json({ data: { id: req.user.sub, email: req.user.email ?? '', isAdmin: req.user.email === env.ADMIN_EMAIL } });
});

export { router as authRoutes };
