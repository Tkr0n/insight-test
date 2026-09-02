import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { shareTaskSchema } from '../validations/share.js';
import { taskIdSchema } from '../validations/task.js';
import { AppError } from '../middlewares/error-handler.js';
import { asyncHandler } from '../middlewares/async-handler.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/',
  validate(taskIdSchema, 'params'),
  validate(shareTaskSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { userId } = req.body as { userId: string };
    const task = await prisma.task.findFirst({
      where: { id, OR: [{ ownerId: req.user!.sub }, { assigneeId: req.user!.sub }] },
    });
    if (!task) throw new AppError(403, 'Forbidden');
    const share = await prisma.taskShare.create({ data: { taskId: id, userId } });
    res.status(201).json({ data: share });
  })
);

router.delete('/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { id, userId } = req.params as { id: string; userId: string };
  await prisma.taskShare.deleteMany({ where: { taskId: id, userId } });
  res.status(204).send();
}));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const shares = await prisma.taskShare.findMany({ where: { taskId: id } });
  res.json({ data: shares });
}));

export { router as shareRoutes };
