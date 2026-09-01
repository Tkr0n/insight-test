import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { TaskRepository } from '../repositories/task-repository';
import { createTaskSchema, updateTaskSchema, taskIdSchema } from '../validations/task';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { idempotency } from '../middlewares/idempotency';
import { AppError } from '../middlewares/error-handler';

const router = Router();
const taskRepo = new TaskRepository(prisma);

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const tasks = await taskRepo.findByOwner(req.user!.sub);
  res.json({ data: tasks });
});

router.get('/:id', validate(taskIdSchema, 'params'), async (req: Request, res: Response) => {
  const taskId = req.params.id as string;
  const task = await taskRepo.findById(taskId, req.user!.sub);
  if (!task) {
    throw new AppError(404, 'Task not found');
  }
  res.json({ data: task });
});

router.post('/', validate(createTaskSchema, 'body'), async (req: Request, res: Response) => {
  const task = await taskRepo.create({
    ...req.body,
    ownerId: req.user!.sub,
  });
  res.status(201).json({ data: task });
});

router.put(
  '/:id',
  validate(taskIdSchema, 'params'),
  validate(updateTaskSchema, 'body'),
  async (req: Request, res: Response) => {
    const taskId = req.params.id as string;
    const task = await taskRepo.update(taskId, req.user!.sub, req.body);
    res.json({ data: task });
  }
);

router.delete('/:id', validate(taskIdSchema, 'params'), async (req: Request, res: Response) => {
  const taskId = req.params.id as string;
  await taskRepo.delete(taskId, req.user!.sub);
  res.status(204).send();
});

router.patch(
  '/:id/done',
  validate(taskIdSchema, 'params'),
  idempotency,
  async (req: Request, res: Response) => {
    const taskId = req.params.id as string;
    const task = await taskRepo.updateTaskStatusLocked(
      taskId,
      req.user!.sub,
      'DONE'
    );
    res.json({ data: task });
  }
);

export { router as taskRoutes };
