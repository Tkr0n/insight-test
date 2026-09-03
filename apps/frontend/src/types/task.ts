export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  ownerId: string;
  assigneeId: string | null;
  startDate: string | null;
  dueDate: string | null;
  urgency: number;
  importance: number;
  tags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskShare {
  id: string;
  taskId: string;
  userId: string;
  sharedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface TaskFilters {
  title?: string;
  tags?: string[];
  assigneeId?: string;
  urgency?: number;
  importance?: number;
  startDateFrom?: string;
  startDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
  status?: TaskStatus[];
}

export interface ApiResponse<T> {
  data: T;
}

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['IN_PROGRESS', 'ARCHIVED'],
  IN_PROGRESS: ['PENDING', 'DONE', 'ARCHIVED'],
  DONE: ['IN_PROGRESS', 'ARCHIVED'],
  ARCHIVED: ['PENDING', 'IN_PROGRESS', 'DONE'],
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  ARCHIVED: 'Archived',
};

export const STATUS_ORDER: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED'];
