import { http } from './http';
import type { PagedResult } from '../types/paging';
import type { UserStatus } from './adminCustomers';

export interface AdminUserListItem {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  status: UserStatus;
  roles: string[];
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminUserQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: UserStatus;
  role?: string;
}

export interface AdminCreateStaffRequest {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  password: string;
  roles: string[];
}

export type AdminUserPage = PagedResult<AdminUserListItem>;

export async function getAdminUsers(params: AdminUserQuery) {
  const response = await http.get<AdminUserPage>('/admin/users', { params });
  return response.data;
}

export async function createAdminStaff(data: AdminCreateStaffRequest) {
  await http.post('/admin/users/staff', data);
}

export async function setAdminUserStatus(id: number, status: UserStatus) {
  await http.patch(`/admin/users/${id}/status`, { status });
}

export async function setAdminUserRoles(id: number, roles: string[]) {
  await http.put(`/admin/users/${id}/roles`, { roles });
}
