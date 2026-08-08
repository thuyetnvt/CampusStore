import { http } from './http';
import type { Cart } from '../types/cart';

export async function getCart() {
  const response = await http.get<Cart>('/cart');
  return response.data;
}

export async function addCartItem(productVariantId: number, quantity: number) {
  const response = await http.post<Cart>('/cart/items', { productVariantId, quantity });
  return response.data;
}

export async function updateCartItem(id: number, quantity: number) {
  const response = await http.put<Cart>(`/cart/items/${id}`, { quantity });
  return response.data;
}

export async function deleteCartItem(id: number) {
  const response = await http.delete<Cart>(`/cart/items/${id}`);
  return response.data;
}

export async function clearCart() {
  await http.delete('/cart');
}
