import { Router, Request, Response } from 'express';
import { randomBytes, randomUUID } from 'crypto';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/async-handler.js';
import { validate } from '../middlewares/validate.js';
import { createUserSchema, updateUserSchema, userIdSchema } from '../validations/user.js';
import { AppError } from '../middlewares/error-handler.js';

const router = Router();

function newCognitoClient() {
  return new CognitoIdentityProviderClient({ region: env.AWS_REGION });
}

// Generate a password that meets the Cognito policy (>=8, upper+lower+number+symbol).
function generateTemporaryPassword(): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%*'];
  const all = sets.join('');
  const bytes = [...randomBytes(16)];
  const chars: string[] = sets.map((s, i) => s[bytes[i] % s.length]);
  for (let i = 4; i < 14; i++) chars.push(all[bytes[i] % all.length]);
  // Shuffle to avoid predictability of the position of each character class
  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// GET /api/users — list distinct users visible to caller (existing)
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const callerId = req.user!.sub;
  const callerEmail = req.user!.email;

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { ownerId: callerId },
        { assigneeId: callerId },
        { shares: { some: { userId: callerId } } },
      ],
    },
    select: { ownerId: true, assigneeId: true },
  });

  const distinctIds = new Set<string>();
  for (const t of tasks) {
    if (t.ownerId) distinctIds.add(t.ownerId);
    if (t.assigneeId) distinctIds.add(t.assigneeId);
  }
  if (!distinctIds.has(callerId)) distinctIds.add(callerId);

  const idsArray = Array.from(distinctIds);

  let users: Array<{ id: string; email: string; name: string | null }> = [];
  if (idsArray.length > 0) {
    const dbUsers = await prisma.user.findMany({
      where: { id: { in: idsArray } },
      select: { id: true, email: true, name: true },
    });

    const dbMap = new Map(dbUsers.map((u) => [u.id, u]));
    users = idsArray.map((id) => {
      const found = dbMap.get(id);
      if (found) return { id: found.id, email: found.email, name: found.name };
      const email = id.includes('@') ? id : callerEmail && id === callerId ? callerEmail : `${id}@example.com`;
      return { id, email, name: null };
    });
  }

  if (users.length === 0) {
    users = [{ id: callerId, email: callerEmail ?? `${callerId}@example.com`, name: null }];
  }

  res.json({ data: users });
}));

// GET /api/users/all — admin list all users (for Users management)
router.get('/all', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: users });
}));

// POST /api/users — admin creates a user in Cognito with a temporary password
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createUserSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name } = req.body as { email: string; name?: string | null };
    const temporaryPassword = generateTemporaryPassword();

    if (!env.COGNITO_USER_POOL_ID) {
      throw new AppError(500, 'Cognito is not configured');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, 'Email already exists');

    let cognitoSub: string | undefined;
    try {
      const created = await newCognitoClient().send(
        new AdminCreateUserCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID,
          Username: email,
          TemporaryPassword: temporaryPassword,
          MessageAction: 'SUPPRESS',
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'name', Value: name ?? 'User' },
            { Name: 'email_verified', Value: 'true' },
          ],
        })
      );
      // Use the Cognito sub as the DB id so the user's JWT identity matches the
      // row, otherwise tasks/permissions get attributed to a mismatched id.
      cognitoSub = created.User?.Attributes?.find((a) => a.Name === 'sub')?.Value;
    } catch (err: unknown) {
      const typed = err as { name?: string; message?: string };
      if (typed.name === 'UsernameExistsException') {
        throw new AppError(409, 'An account with this email already exists');
      }
      throw new AppError(500, typed.message ?? 'Failed to create Cognito user');
    }

    const id = cognitoSub ?? randomUUID();

    try {
      const user = await prisma.user.create({
        data: { id, email, name: name ?? null },
      });
      res.status(201).json({ data: { user, temporaryPassword } });
    } catch {
      // Roll back the Cognito user if the DB write fails
      try {
        await newCognitoClient().send(
          new AdminDeleteUserCommand({ UserPoolId: env.COGNITO_USER_POOL_ID, Username: email })
        );
      } catch {
        // ignore
      }
      throw new AppError(500, 'Failed to save user');
    }
  })
);

// PUT /api/users/:id — admin updates a user
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(userIdSchema, 'params'),
  validate(updateUserSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { email, name } = req.body as { email?: string; name?: string | null };

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'User not found');

    if (email && email !== existing.email) {
      const dup = await prisma.user.findUnique({ where: { email } });
      if (dup) throw new AppError(409, 'Email already exists');
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(name !== undefined ? { name } : {}),
      },
    });

    // Best-effort sync of mutable attributes to Cognito (username stays the email).
    try {
      const attrs = [
        ...(name !== undefined ? [{ Name: 'name', Value: name ?? '' }] : []),
      ];
      if (attrs.length > 0) {
        await newCognitoClient().send(
          new AdminUpdateUserAttributesCommand({ UserPoolId: env.COGNITO_USER_POOL_ID, Username: existing.email, UserAttributes: attrs })
        );
      }
    } catch {
      // Non-blocking: DB is the source of truth
    }

    res.json({ data: user });
  })
);

// DELETE /api/users/:id — admin deletes a user (and their Cognito account)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate(userIdSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const callerId = req.user!.sub;
    if (id === callerId) throw new AppError(403, 'Cannot delete your own account');

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'User not found');

    const owned = await prisma.task.count({ where: { ownerId: id } });
    if (owned > 0) throw new AppError(409, `User owns ${owned} tasks — reassign or delete tasks first`);

    await prisma.task.updateMany({ where: { assigneeId: id }, data: { assigneeId: null } });
    await prisma.taskShare.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    // Best-effort removal of the Cognito account.
    try {
      await newCognitoClient().send(
        new AdminDeleteUserCommand({ UserPoolId: env.COGNITO_USER_POOL_ID, Username: existing.email })
      );
    } catch {
      // Non-blocking: DB is the source of truth
    }

    res.status(204).send();
  })
);

export { router as userRoutes };
