import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
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
  // Ensure caller is always represented so frontend has at least one user
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
      // Dummy fallback when User table is empty
      const email = id.includes('@') ? id : callerEmail && id === callerId ? callerEmail : `${id}@example.com`;
      return { id, email, name: null };
    });
  }

  // Fallback if no tasks and no ids (should not happen due to callerId)
  if (users.length === 0) {
    users = [{ id: callerId, email: callerEmail ?? `${callerId}@example.com`, name: null }];
  }

  res.json({ data: users });
});

export { router as userRoutes };
