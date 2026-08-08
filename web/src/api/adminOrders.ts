import { http } from './http';
import type { AdminOrderDetail, AdminOrderPage } from '../types/admin-order';
import type { OrderStatus } from '../types/order';

export async function getAdminOrders(page = 1, status?: OrderStatus, keyword?: string) {
  const response = await http.get<AdminOrderPage>('/admin/orders', {
    params: { page, pageSize: 20, status, keyword }
  });
  return response.data;
}

export async function getAdminOrder(id: number) {
  const response = await http.get<AdminOrderDetail>(`/admin/orders/${id}`);
  return response.data;
}

export async function updateAdminOrderStatus(id: number, status: OrderStatus, note?: string) {
  await http.put(`/admin/orders/${id}/status`, { status, note });
}
