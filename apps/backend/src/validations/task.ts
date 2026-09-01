import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED']).optional(),
});

export const taskIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
