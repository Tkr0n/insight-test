import { TaskStatus } from '@prisma/client';

export type { TaskStatus };

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['IN_PROGRESS', 'ARCHIVED'],
  IN_PROGRESS: ['DONE', 'ARCHIVED'],
  DONE: ['ARCHIVED'],
  ARCHIVED: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid state transition: ${from} → ${to}`);
    this.name = 'InvalidStateTransitionError';
  }
}

export function validateStateTransition(from: TaskStatus, to: TaskStatus): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new InvalidStateTransitionError(from, to);
  }
}
