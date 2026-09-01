import { TaskStatus } from '@prisma/client';

export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly currentStatus: string,
    public readonly targetStatus: string
  ) {
    super(
      `Invalid state transition: ${currentStatus} -> ${targetStatus}. ` +
        `Allowed transitions from ${currentStatus}: ${VALID_TRANSITIONS[currentStatus as TaskStatus]?.join(', ') ?? 'none'}.`
    );
    this.name = 'InvalidStateTransitionError';
  }
}

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: [TaskStatus.IN_PROGRESS, TaskStatus.ARCHIVED],
  IN_PROGRESS: [TaskStatus.DONE, TaskStatus.ARCHIVED],
  DONE: [TaskStatus.ARCHIVED],
  ARCHIVED: [],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function getValidTransitions(status: TaskStatus): TaskStatus[] {
  return VALID_TRANSITIONS[status];
}

export function validateStateTransition(
  currentStatus: string,
  newStatus: string
): void {
  const valid = canTransition(
    currentStatus as TaskStatus,
    newStatus as TaskStatus
  );
  if (!valid) {
    throw new InvalidStateTransitionError(currentStatus, newStatus);
  }
}
