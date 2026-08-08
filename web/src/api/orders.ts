import { http } from './http';
import type { CreateReviewRequest, OrderDetail, OrderPage } from '../types/order';

export async function getOrders(page = 1, pageSize = 10) {
  const response = await http.get<OrderPage>('/orders', { params: { page, pageSize } });
  return response.data;
}

export async function getOrder(id: number) {
  const response = await http.get<OrderDetail>(`/orders/${id}`);
  return response.data;
}

export async function cancelOrder(id: number, reason?: string) {
  await http.post(`/orders/${id}/cancel`, { reason });
}

export async function createReview(request: CreateReviewRequest) {
  await http.post('/reviews', request);
}
