import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/async-handler.js';
import { validate } from '../middlewares/validate.js';
import { createUserSchema, updateUserSchema, userIdSchema } from '../validations/user.js';
import { AppError } from '../middlewares/error-handler.js';

const router = Router();

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

// POST /api/users — create user
router.post('/', authenticate, validate(createUserSchema, 'body'), asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body as { email: string; name?: string | null };
  const id = randomUUID();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Email already exists');

  const user = await prisma.user.create({
    data: { id, email, name: name ?? null },
  });
  res.status(201).json({ data: user });
}));

// PUT /api/users/:id — update user
router.put('/:id', authenticate, validate(userIdSchema, 'params'), validate(updateUserSchema, 'body'), asyncHandler(async (req: Request, res: Response) => {
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
  res.json({ data: user });
}));

// DELETE /api/users/:id
router.delete('/:id', authenticate, validate(userIdSchema, 'params'), asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const callerId = req.user!.sub;
  if (id === callerId) throw new AppError(403, 'Cannot delete your own account');

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'User not found');

  // Count owned tasks — prevent orphaning
  const owned = await prisma.task.count({ where: { ownerId: id } });
  if (owned > 0) throw new AppError(409, `User owns ${owned} tasks — reassign or delete tasks first`);

  await prisma.task.updateMany({ where: { assigneeId: id }, data: { assigneeId: null } });
  await prisma.taskShare.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  res.status(204).send();
}));

export { router as userRoutes };
