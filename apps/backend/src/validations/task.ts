import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  assigneeId: z.string().min(1).optional().nullable(),
  startDate: z.string().datetime().optional().nullable().or(z.string().date().optional().nullable()),
  dueDate: z.string().datetime().optional().nullable().or(z.string().date().optional().nullable()),
  urgency: z.number().int().min(1).max(4).optional(),
  importance: z.number().int().min(1).max(4).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assigneeId: z.string().min(1).optional().nullable(),
  startDate: z.string().datetime().optional().nullable().or(z.string().date().optional().nullable()),
  dueDate: z.string().datetime().optional().nullable().or(z.string().date().optional().nullable()),
  urgency: z.number().int().min(1).max(4).optional(),
  importance: z.number().int().min(1).max(4).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED']).optional(),
});

export const taskIdSchema = z.object({
  id: z.string().uuid(),
});
