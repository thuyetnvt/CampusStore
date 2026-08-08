import { http } from './http';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

export async function getMe() {
  const response = await http.get<AuthUser>('/auth/me');
  return response.data;
}

export async function login(request: LoginRequest) {
  const response = await http.post<AuthUser>('/auth/login', request);
  return response.data;
}

export async function register(request: RegisterRequest) {
  const response = await http.post<AuthUser>('/auth/register', request);
  return response.data;
}

export async function logout() {
  await http.post('/auth/logout');
}
