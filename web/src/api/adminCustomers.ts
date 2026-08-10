import { http } from './http';
import type { PagedResult } from '../types/paging';

export type UserStatus = 1 | 2 | 3;

export interface AdminCustomerListItem {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  status: UserStatus;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminCustomerQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: UserStatus;
}

export type AdminCustomerPage = PagedResult<AdminCustomerListItem>;

export async function getAdminCustomers(params: AdminCustomerQuery) {
  const response = await http.get<AdminCustomerPage>('/admin/customers', { params });
  return response.data;
}

export async function setAdminCustomerStatus(id: number, status: UserStatus) {
  await http.patch(`/admin/customers/${id}/status`, { status });
}
