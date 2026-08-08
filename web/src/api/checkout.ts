import { http } from './http';
import type { CheckoutPreview, CreateOrderRequest, OrderCreated } from '../types/checkout';

export async function previewCheckout(couponCode?: string) {
  const response = await http.post<CheckoutPreview>('/checkout/preview', { couponCode });
  return response.data;
}

export async function createOrder(request: CreateOrderRequest) {
  const response = await http.post<OrderCreated>('/orders', request);
  return response.data;
}
