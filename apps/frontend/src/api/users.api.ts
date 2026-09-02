import { apiClient } from './axios-client';
import type { User, ApiResponse } from '../types/task';

export async function fetchUsers(): Promise<User[]> {
  const response = await apiClient.get<ApiResponse<User[]>>('/users');
  return response.data.data;
}

export async function fetchAllUsers(): Promise<(User & { createdAt?: string })[]> {
  const response = await apiClient.get<ApiResponse<(User & { createdAt?: string })[]>>('/users/all');
  return response.data.data;
}

export async function createUser(data: { email: string; name?: string | null }): Promise<User> {
  const response = await apiClient.post<ApiResponse<User>>('/users', data);
  return response.data.data;
}

export async function updateUser(id: string, data: { email?: string; name?: string | null }): Promise<User> {
  const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
  return response.data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
