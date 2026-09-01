import { apiClient } from './axios-client';
import type { Task, TaskStatus, ApiResponse } from '../types/task';

export async function fetchTasks(): Promise<Task[]> {
  const response = await apiClient.get<ApiResponse<Task[]>>('/tasks');
  return response.data.data;
}

export async function createTask(payload: {
  title: string;
  description?: string;
}): Promise<Task> {
  const response = await apiClient.post<ApiResponse<Task>>('/tasks', payload);
  return response.data.data;
}

export async function updateTask(
  id: string,
  payload: { title?: string; description?: string; status?: TaskStatus }
): Promise<Task> {
  const response = await apiClient.put<ApiResponse<Task>>(
    `/tasks/${id}`,
    payload
  );
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
