import type { PagedResult } from './paging';

export enum OrderStatus {
  Pending = 1,
  Confirmed = 2,
  Preparing = 3,
  Shipping = 4,
  Completed = 5,
  Cancelled = 6
}

export enum PaymentStatus {
  Unpaid = 1,
  Pending = 2,
  Paid = 3,
  Failed = 4,
  Refunded = 5
}

export interface OrderListItem {
  id: number;
  orderCode: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  totalQuantity: number;
}

export interface OrderDetail {
  id: number;
  orderCode: string;
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

export interface OrderItem {
  id: number;
  productVariantId: number | null;
  productId: number | null;
  productName: string;
  sku: string;
  variantDescription: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  primaryImageUrl: string | null;
  hasReview: boolean;
}

export interface OrderStatusHistory {
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  note: string | null;
  createdAt: string;
}

export type OrderPage = PagedResult<OrderListItem>;

export interface CreateReviewRequest {
  orderItemId: number;
  rating: number;
  comment?: string;
}
