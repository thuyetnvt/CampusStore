import type { CartItem } from './cart';

export interface CheckoutPreview {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  couponCode: string | null;
  couponMessage: string | null;
}

export interface CreateOrderRequest {
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  paymentMethod: number;
  couponCode?: string;
  note?: string;
}

export interface OrderCreated {
  id: number;
  orderCode: string;
  totalAmount: number;
}
