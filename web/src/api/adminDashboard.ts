import { http } from './http';
import type { AdminDashboard, AdminDashboardRange } from '../types/admin-dashboard';

export async function getAdminDashboard(range: AdminDashboardRange = 'day') {
  const response = await http.get<AdminDashboard>('/admin/dashboard', { params: { range } });
  return response.data;
}
