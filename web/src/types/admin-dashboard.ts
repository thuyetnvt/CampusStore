import type { AdminOrderListItem } from './admin-order';
import type { OrderStatus } from './order';

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface LowStockVariant {
  productId: number;
  productVariantId: number;
  productName: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface AdminDashboard {
  completedRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  lowStockVariants: number;
  totalCustomers: number;
  ordersByStatus: OrderStatusCount[];
  topProducts: TopProduct[];
  lowStockItems: LowStockVariant[];
  recentOrders: AdminOrderListItem[];
}
