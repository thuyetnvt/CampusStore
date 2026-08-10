import { http } from './http';
import type { PagedResult } from '../types/paging';

export type DiscountType = 1 | 2;

export interface AdminCouponListItem {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  startAt: string;
  endAt: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  status: string;
}

export interface AdminCouponQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  isActive?: boolean;
}

export interface AdminCouponUpsertRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  startAt: string;
  endAt: string;
  usageLimit: number;
  isActive: boolean;
}

export type AdminCouponPage = PagedResult<AdminCouponListItem>;

export async function getAdminCoupons(params: AdminCouponQuery) {
  const response = await http.get<AdminCouponPage>('/admin/coupons', { params });
  return response.data;
}

export async function createAdminCoupon(data: AdminCouponUpsertRequest) {
  const response = await http.post<AdminCouponListItem>('/admin/coupons', data);
  return response.data;
}

export async function updateAdminCoupon(id: number, data: AdminCouponUpsertRequest) {
  const response = await http.put<AdminCouponListItem>(`/admin/coupons/${id}`, data);
  return response.data;
}

export async function setAdminCouponActive(id: number, isActive: boolean) {
  await http.patch(`/admin/coupons/${id}/active`, { isActive });
}
