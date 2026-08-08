import type { PagedResult } from './paging';
import { OrderStatus, PaymentStatus } from './order';
import type { OrderItem, OrderStatusHistory } from './order';

export interface AdminOrderListItem {
  id: number;
  orderCode: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  totalQuantity: number;
}

export interface AdminOrderDetail {
  id: number;
  orderCode: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  note: string | null;
  cancellationReason: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistories: OrderStatusHistory[];
}

export type AdminOrderPage = PagedResult<AdminOrderListItem>;
