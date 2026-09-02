import { apiClient } from './axios-client';
import type { Task, TaskStatus, ApiResponse, TaskFilters } from '../types/task';

export async function fetchTasks(filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.title) params.set('title', filters.title);
  if (filters?.tags?.length) params.set('tags', filters.tags.join(','));
  if (filters?.assigneeId) params.set('assigneeId', filters.assigneeId);
  if (filters?.urgency !== undefined) params.set('urgency', String(filters.urgency));
  if (filters?.importance !== undefined) params.set('importance', String(filters.importance));
  if (filters?.startDateFrom) params.set('startDateFrom', filters.startDateFrom);
  if (filters?.startDateTo) params.set('startDateTo', filters.startDateTo);
  if (filters?.dueDateFrom) params.set('dueDateFrom', filters.dueDateFrom);
  if (filters?.dueDateTo) params.set('dueDateTo', filters.dueDateTo);
  if (filters?.overdue) params.set('overdue', 'true');
  if (filters?.status?.length) params.set('status', filters.status.join(','));

  const query = params.toString();
  const url = query ? `/tasks?${query}` : '/tasks';
  const response = await apiClient.get<ApiResponse<Task[]>>(url);
  return response.data.data;
}

export async function createTask(payload: {
  title: string;
  description?: string;
  assigneeId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  urgency?: number;
  importance?: number;
  tags?: string[];
}): Promise<Task> {
  const response = await apiClient.post<ApiResponse<Task>>('/tasks', payload);
  return response.data.data;
}

export async function updateTask(
  id: string,
  payload: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    assigneeId?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
    urgency?: number;
    importance?: number;
    tags?: string[];
  }
): Promise<Task> {
  const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, payload);
  return response.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

export async function markAsDone(id: string): Promise<Task> {
  const response = await apiClient.patch<ApiResponse<Task>>(
    `/tasks/${id}/done`,
    {},
    { headers: { 'Idempotency-Key': crypto.randomUUID() } }
  );
  return response.data.data;
}
