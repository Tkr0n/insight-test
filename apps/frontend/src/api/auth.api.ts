import { apiClient } from './axios-client';
import type { ApiResponse } from '../types/task';

export interface MeResponse {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface LoginResult {
  csrfToken?: string;
  challenge?: string;
  session?: string;
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await apiClient.get<ApiResponse<MeResponse>>('/auth/me');
  return res.data.data;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await apiClient.post<ApiResponse<LoginResult>>('/auth/login', { email, password });
  return res.data.data;
}

export async function register(email: string, password: string, name?: string | null): Promise<void> {
  await apiClient.post<ApiResponse<{ email: string }>>('/auth/register', { email, password, name });
}

export async function changePassword(email: string, session: string, newPassword: string): Promise<void> {
  await apiClient.post<ApiResponse<{ csrfToken?: string }>>('/auth/change-password', {
    email,
    session,
    newPassword,
  });
}
