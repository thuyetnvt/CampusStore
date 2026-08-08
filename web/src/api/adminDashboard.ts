import { http } from './http';
import type { AdminDashboard } from '../types/admin-dashboard';

export async function getAdminDashboard() {
  const response = await http.get<AdminDashboard>('/admin/dashboard');
  return response.data;
}
