import { TaskStatus } from '@prisma/client';

export type { TaskStatus };

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['IN_PROGRESS', 'ARCHIVED'],
  IN_PROGRESS: ['PENDING', 'DONE', 'ARCHIVED'],
  DONE: ['IN_PROGRESS', 'ARCHIVED'],
  ARCHIVED: ['DONE'],
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
