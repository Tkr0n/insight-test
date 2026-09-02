import { z } from 'zod';
export const shareTaskSchema = z.object({ userId: z.string().min(1) });
export const shareParamsSchema = z.object({ id: z.string().uuid(), userId: z.string().min(1) });
