import { apiClient } from './axios-client';
import type { ApiResponse } from '../types/task';

export interface MeResponse {
  id: string;
  email: string;
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await apiClient.get<ApiResponse<MeResponse>>('/auth/me');
  return res.data.data;
}
