import { http } from './http';
import type { PagedResult } from '../types/paging';

export interface AdminCategoryListItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  parentId: number | null;
  productCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminCategoryQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  isActive?: boolean;
}

export interface AdminCategoryUpsertRequest {
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  isActive: boolean;
}

export type AdminCategoryPage = PagedResult<AdminCategoryListItem>;

export async function getAdminCategories(params: AdminCategoryQuery) {
  const response = await http.get<AdminCategoryPage>('/admin/categories', { params });
  return response.data;
}

export async function createAdminCategory(data: AdminCategoryUpsertRequest) {
  const response = await http.post<AdminCategoryListItem>('/admin/categories', data);
  return response.data;
}

export async function updateAdminCategory(id: number, data: AdminCategoryUpsertRequest) {
  const response = await http.put<AdminCategoryListItem>(`/admin/categories/${id}`, data);
  return response.data;
}

export async function setAdminCategoryActive(id: number, isActive: boolean) {
  await http.patch(`/admin/categories/${id}/active`, { isActive });
}
