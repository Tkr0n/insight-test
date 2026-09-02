import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(255).optional().nullable(),
});

export const updateUserSchema = z.object({
  email: z.string().email().max(255).optional(),
  name: z.string().min(1).max(255).optional().nullable(),
});

export const userIdSchema = z.object({
  id: z.string().min(1),
});
