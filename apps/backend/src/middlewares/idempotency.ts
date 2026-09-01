import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { AppError } from './error-handler';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

export function idempotency(req: Request, _res: Response, next: NextFunction): void {
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

  if (!idempotencyKey) {
    throw new AppError(400, 'Missing Idempotency-Key header');
  }

  req.idempotencyKey = idempotencyKey;
  next();
}

export async function withIdempotencyCheck(
  req: Request,
  res: Response,
  handler: () => Promise<void>
): Promise<void> {
  const lockKey = `idempotency:${req.idempotencyKey!}`;
  const acquired = await redis.set(lockKey, '1', 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX');

  if (!acquired) {
    throw new AppError(409, 'Conflict: Request already processed');
  }

  try {
    await handler();
  } catch (error) {
    await redis.del(lockKey);
    throw error;
  }
}

declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}
