import type { TaskStatus } from '../types/task';

export function isDoneTransition(status: TaskStatus): boolean {
  return status === 'DONE';
}
