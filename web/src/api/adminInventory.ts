import { http } from './http';
import type { PagedResult } from '../types/paging';

export interface AdminInventoryItem {
  productId: number;
  productVariantId: number;
  productName: string;
  categoryName: string;
  sku: string;
  color: string | null;
  size: string | null;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  stockStatus: string;
}

export interface AdminInventoryQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: number;
  stockState?: 'in_stock' | 'low_stock' | 'out_of_stock';
  isActive?: boolean;
}

export interface AdminInventoryUpdateRequest {
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  reason: string | null;
}

export type AdminInventoryPage = PagedResult<AdminInventoryItem>;

export async function getAdminInventory(params: AdminInventoryQuery) {
  const response = await http.get<AdminInventoryPage>('/admin/inventory', { params });
  return response.data;
}

export async function updateAdminInventoryItem(variantId: number, data: AdminInventoryUpdateRequest) {
  await http.patch(`/admin/inventory/${variantId}`, data);
}
