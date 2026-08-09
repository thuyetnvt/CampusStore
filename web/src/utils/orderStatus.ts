import { OrderStatus } from '../types/order';

const legacyHiddenStatus = 3;

export const visibleOrderStatusOptions: OrderStatus[] = [
  OrderStatus.Pending,
  OrderStatus.Confirmed,
  OrderStatus.Shipping,
  OrderStatus.Completed,
  OrderStatus.Cancelled
];

export const customerCancellableStatuses: OrderStatus[] = [OrderStatus.Pending, OrderStatus.Confirmed];

export function getOrderStatusLabel(status: OrderStatus | number) {
  switch (status) {
    case OrderStatus.Pending:
      return 'Chờ xác nhận';
    case OrderStatus.Confirmed:
      return 'Đã xác nhận';
    case OrderStatus.Shipping:
      return 'Đang giao';
    case OrderStatus.Completed:
      return 'Hoàn tất';
    case OrderStatus.Cancelled:
      return 'Đã hủy';
    default:
      return 'Đang giao';
  }
}

export function getAdminNextStatuses(status: OrderStatus | number) {
  switch (status) {
    case OrderStatus.Pending:
      return [OrderStatus.Confirmed, OrderStatus.Cancelled];
    case OrderStatus.Confirmed:
      return [OrderStatus.Shipping, OrderStatus.Cancelled];
    case OrderStatus.Shipping:
    case legacyHiddenStatus:
      return [OrderStatus.Completed];
    default:
      return [];
  }
}
