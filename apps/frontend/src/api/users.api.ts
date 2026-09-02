import { apiClient } from './axios-client';
import type { User, ApiResponse } from '../types/task';

export async function fetchUsers(): Promise<User[]> {
  const response = await apiClient.get<ApiResponse<User[]>>('/users');
  return response.data.data;
}
