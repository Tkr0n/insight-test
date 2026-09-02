import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(255).optional().nullable(),
});

export const changePasswordSchema = z.object({
  email: z.string().email(),
  session: z.string().min(1),
  newPassword: z.string().min(8),
});
