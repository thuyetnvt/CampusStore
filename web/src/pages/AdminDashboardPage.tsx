import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BadgeDollarSign, ShoppingBag, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { getAdminDashboard } from '../api/adminDashboard';
import { formatCurrency } from '../utils/format';
import { OrderStatus } from '../types/order';

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'Chờ xác nhận',
  [OrderStatus.Confirmed]: 'Đã xác nhận',
  [OrderStatus.Preparing]: 'Đang chuẩn bị',
  [OrderStatus.Shipping]: 'Đang giao',
  [OrderStatus.Completed]: 'Hoàn tất',
  [OrderStatus.Cancelled]: 'Đã hủy'
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function AdminDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
    retry: false
  });

  if (dashboardQuery.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-40 rounded-md bg-slate-100" />
      </section>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
          Bạn cần đăng nhập bằng tài khoản Staff hoặc Admin để xem dashboard.
        </div>
      </section>
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Bảng quản trị</h1>
          <p className="mt-2 text-sm text-slate-600">Theo dõi doanh thu, đơn hàng, tồn kho và sản phẩm bán chạy.</p>
        </div>
        <Link to="/admin/orders" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
          Xem đơn hàng
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<BadgeDollarSign className="h-5 w-5" />} label="Doanh thu hoàn tất" value={formatCurrency(dashboard.completedRevenue)} />
        <StatCard icon={<ShoppingBag className="h-5 w-5" />} label="Tổng đơn" value={dashboard.totalOrders.toString()} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Đơn chờ xác nhận" value={dashboard.pendingOrders.toString()} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Khách hàng" value={dashboard.totalCustomers.toString()} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-950">Sản phẩm bán chạy</h2>
            <div className="mt-4 space-y-3">
              {dashboard.topProducts.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-950">{item.productName}</div>
                    <div className="text-slate-500">{item.quantitySold} sản phẩm</div>
                  </div>
                  <div className="font-semibold text-emerald-700">{formatCurrency(item.revenue)}</div>
                </div>
              ))}
              {!dashboard.topProducts.length ? <div className="text-sm text-slate-500">Chưa có dữ liệu bán hàng.</div> : null}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-950">Đơn hàng gần đây</h2>
            <div className="mt-4 space-y-3">
              {dashboard.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders`}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2 hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium text-slate-950">{order.orderCode}</div>
                    <div className="text-sm text-slate-500">{order.customerName}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{statusLabels[order.orderStatus]}</div>
                    <div className="text-slate-500">{formatDate(order.createdAt)}</div>
                  </div>
                </Link>
              ))}
              {!dashboard.recentOrders.length ? <div className="text-sm text-slate-500">Chưa có đơn hàng gần đây.</div> : null}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-950">Tồn kho thấp</h2>
            <div className="mt-4 space-y-3">
              {dashboard.lowStockItems.map((item) => (
                <div key={item.productVariantId} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-950">{item.productName}</div>
                    <div className="text-slate-500">{item.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-rose-700">{item.stockQuantity} còn lại</div>
                    <div className="text-slate-500">Ngưỡng {item.lowStockThreshold}</div>
                  </div>
                </div>
              ))}
              {!dashboard.lowStockItems.length ? <div className="text-sm text-slate-500">Không có biến thể nào sắp hết hàng.</div> : null}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-950">Tổng quan đơn hàng</h2>
            <div className="mt-4 space-y-2 text-sm">
              {dashboard.ordersByStatus.map((item) => (
                <div key={item.status} className="flex justify-between">
                  <span>{statusLabels[item.status]}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-emerald-700">
        {icon}
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}
