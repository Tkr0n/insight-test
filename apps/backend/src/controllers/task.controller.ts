import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { TaskRepository, TaskFilter } from '../repositories/task-repository.js';
import { MarkAsDoneUseCase } from '../use-cases/mark-as-done.js';
import { createTaskSchema, updateTaskSchema, taskIdSchema } from '../validations/task.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idempotency, withIdempotencyCheck } from '../middlewares/idempotency.js';
import { AppError } from '../middlewares/error-handler.js';
import { asyncHandler } from '../middlewares/async-handler.js';

const router = Router();
const taskRepo = new TaskRepository(prisma);
const markAsDone = new MarkAsDoneUseCase(taskRepo);

router.use(authenticate);

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | string[] | undefined>;

  const filter: TaskFilter = {};

  if (typeof q.title === 'string' && q.title.trim()) {
    filter.title = q.title.trim();
  }

  if (q.tags !== undefined) {
    const raw = Array.isArray(q.tags) ? q.tags.join(',') : (q.tags as string);
    if (typeof raw === 'string' && raw.trim()) {
      filter.tags = raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }

  if (typeof q.assigneeId === 'string' && q.assigneeId.trim()) {
    filter.assigneeId = q.assigneeId.trim();
  }

  if (typeof q.urgency === 'string' && q.urgency.trim()) {
    const v = Number(q.urgency);
    if (!Number.isNaN(v)) filter.urgency = v;
  }

  if (typeof q.importance === 'string' && q.importance.trim()) {
    const v = Number(q.importance);
    if (!Number.isNaN(v)) filter.importance = v;
  }

  if (typeof q.startDateFrom === 'string' && q.startDateFrom.trim()) {
    filter.startDateFrom = q.startDateFrom.trim();
  }
  if (typeof q.startDateTo === 'string' && q.startDateTo.trim()) {
    filter.startDateTo = q.startDateTo.trim();
  }
  if (typeof q.dueDateFrom === 'string' && q.dueDateFrom.trim()) {
    filter.dueDateFrom = q.dueDateFrom.trim();
  }
  if (typeof q.dueDateTo === 'string' && q.dueDateTo.trim()) {
    filter.dueDateTo = q.dueDateTo.trim();
  }

  if (typeof q.overdue === 'string') {
    filter.overdue = q.overdue === 'true';
  } else if (Array.isArray(q.overdue) && q.overdue.includes('true')) {
    filter.overdue = true;
  }

  if (q.status !== undefined) {
    const raw = Array.isArray(q.status) ? q.status.join(',') : (q.status as string);
    if (typeof raw === 'string' && raw.trim()) {
      filter.status = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as TaskFilter['status'];
    }
  }

  const tasks = await taskRepo.findByOwner(req.user!.sub, filter);
  res.json({ data: tasks });
}));

router.get('/:id', validate(taskIdSchema, 'params'), asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.id as string;
  const task = await taskRepo.findAccessibleTask(taskId, req.user!.sub);
  if (!task) {
    throw new AppError(404, 'Task not found');
  }
  res.json({ data: task });
}));

router.post('/', validate(createTaskSchema, 'body'), asyncHandler(async (req: Request, res: Response) => {
  const task = await taskRepo.create({
    ...req.body,
    ownerId: req.user!.sub,
  });
  res.status(201).json({ data: task });
}));

router.put(
  '/:id',
  validate(taskIdSchema, 'params'),
  validate(updateTaskSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const taskId = req.params.id as string;
    const task = await taskRepo.updateWithPermission(taskId, req.user!.sub, req.body);
    res.json({ data: task });
  })
);

router.delete('/:id', validate(taskIdSchema, 'params'), asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.id as string;
  await taskRepo.delete(taskId, req.user!.sub);
  res.status(204).send();
}));

router.patch(
  '/:id/done',
  validate(taskIdSchema, 'params'),
  idempotency,
  asyncHandler(async (req: Request, res: Response) => {
    const taskId = req.params.id as string;
    await withIdempotencyCheck(req, res, async () => {
      await markAsDone.execute({ taskId, ownerId: req.user!.sub });
    });
    const task = await taskRepo.findAccessibleTask(taskId, req.user!.sub);
    res.json({ data: task });
  })
);

export { router as taskRoutes };
