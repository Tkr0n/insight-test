import { apiClient } from './axios-client';
import type { TaskShare, ApiResponse } from '../types/task';

export async function fetchShares(taskId: string): Promise<TaskShare[]> {
  const response = await apiClient.get<ApiResponse<TaskShare[]>>(`/tasks/${taskId}/share`);
  return response.data.data;
}

export async function shareTask(taskId: string, userId: string): Promise<TaskShare> {
  const response = await apiClient.post<ApiResponse<TaskShare>>(`/tasks/${taskId}/share`, {
    userId,
  });
  return response.data.data;
}

export async function unshareTask(taskId: string, userId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}/share/${userId}`);
}
