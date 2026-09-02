import { apiClient } from './axios-client';
import type { User, ApiResponse } from '../types/task';

export async function fetchUsers(): Promise<User[]> {
  // Use /users/all so newly created users (without tasks) also appear in assignee dropdowns
  try {
    const response = await apiClient.get<ApiResponse<User[]>>('/users/all');
    return response.data.data;
  } catch {
    const fallback = await apiClient.get<ApiResponse<User[]>>('/users');
    return fallback.data.data;
  }
}

export async function fetchAllUsers(): Promise<(User & { createdAt?: string })[]> {
  const response = await apiClient.get<ApiResponse<(User & { createdAt?: string })[]>>('/users/all');
  return response.data.data;
}

export async function createUser(data: { email: string; name?: string | null }): Promise<{
  user: User;
  temporaryPassword: string;
}> {
  const response = await apiClient.post<ApiResponse<{ user: User; temporaryPassword: string }>>('/users', data);
  return response.data.data;
}

export async function updateUser(id: string, data: { email?: string; name?: string | null }): Promise<User> {
  const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
  return response.data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
