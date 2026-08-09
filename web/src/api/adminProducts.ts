import { http } from './http';
import type { PagedResult } from '../types/paging';

export interface AdminProductListItem {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  categoryName: string;
  description: string;
  basePrice: number;
  salePrice: number | null;
  isActive: boolean;
  totalStock: number;
  variantCount: number;
  primaryImageUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export type AdminProductDetail = AdminProductListItem;

export interface AdminProductQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: number;
  isActive?: boolean;
}

export interface AdminProductUpsertRequest {
  name: string;
  slug: string;
  categoryId: number;
  description: string;
  basePrice: number;
  salePrice: number | null;
  isActive: boolean;
}

export type AdminProductPage = PagedResult<AdminProductListItem>;

export async function getAdminProducts(params: AdminProductQuery) {
  const response = await http.get<AdminProductPage>('/admin/products', { params });
  return response.data;
}

export async function getAdminProduct(id: number) {
  const response = await http.get<AdminProductDetail>(`/admin/products/${id}`);
  return response.data;
}

export async function createAdminProduct(data: AdminProductUpsertRequest) {
  const response = await http.post<AdminProductDetail>('/admin/products', data);
  return response.data;
}

export async function updateAdminProduct(id: number, data: AdminProductUpsertRequest) {
  const response = await http.put<AdminProductDetail>(`/admin/products/${id}`, data);
  return response.data;
}

export async function setAdminProductActive(id: number, isActive: boolean) {
  await http.patch(`/admin/products/${id}/active`, { isActive });
}
