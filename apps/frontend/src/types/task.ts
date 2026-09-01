export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  ownerId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
}

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['IN_PROGRESS', 'ARCHIVED'],
  IN_PROGRESS: ['DONE', 'ARCHIVED'],
  DONE: ['ARCHIVED'],
  ARCHIVED: [],
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  ARCHIVED: 'Archived',
};
