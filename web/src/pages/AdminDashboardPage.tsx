import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useState, type ReactNode } from 'react';
import { getAdminDashboard } from '../api/adminDashboard';
import type { AdminDashboardRange } from '../types/admin-dashboard';
import { formatCurrency } from '../utils/format';
import { getOrderStatusLabel } from '../utils/orderStatus';

const rangeLabels: Record<AdminDashboardRange, string> = {
  day: 'Theo ngày',
  week: 'Theo tuần',
  month: 'Theo tháng'
};

export function AdminDashboardPage() {
  const [range, setRange] = useState<AdminDashboardRange>('day');
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard', range],
    queryFn: () => getAdminDashboard(range),
    retry: false
  });

  const dashboard = dashboardQuery.data;
  const maxRevenue = Math.max(...(dashboard?.trendPoints.map((point) => point.revenue) ?? [0]), 1);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin / Staff</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Theo dõi doanh thu, đơn hàng và tồn kho cần chú ý.</p>
        </div>
        <div className="flex rounded-md border border-slate-300 bg-white p-1">
          {(Object.keys(rangeLabels) as AdminDashboardRange[]).map((value) => (
            <button
              key={value}
              type="button"
              className={`rounded px-3 py-1.5 text-sm font-semibold ${
                range === value ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
              onClick={() => setRange(value)}
            >
              {rangeLabels[value]}
            </button>
          ))}
        </div>
      </div>

      {dashboardQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-md bg-white" />
          ))}
        </div>
      ) : null}

      {dashboardQuery.isError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Không tải được dữ liệu dashboard. Vui lòng kiểm tra quyền Staff/Admin.
        </div>
      ) : null}

      {dashboard ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Doanh thu hoàn tất" value={formatCurrency(dashboard.completedRevenue)} />
            <StatCard label="Tổng đơn" value={dashboard.totalOrders.toString()} />
            <StatCard label="Đơn chờ xử lý" value={dashboard.pendingOrders.toString()} />
            <StatCard label="Biến thể sắp hết" value={dashboard.lowStockVariants.toString()} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-950">Doanh thu và số đơn</h2>
              <div className="mt-4 space-y-3">
                {dashboard.trendPoints.map((point) => (
                  <div key={point.label} className="grid grid-cols-[72px_1fr_92px] items-center gap-3 text-sm">
                    <span className="text-slate-500">{point.label}</span>
                    <div className="h-8 overflow-hidden rounded bg-slate-100">
                      <div
                        className="h-full rounded bg-emerald-600"
                        style={{ width: `${Math.max((point.revenue / maxRevenue) * 100, point.revenue > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <span className="text-right font-semibold text-slate-900">{point.orderCount} đơn</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-950">Trạng thái đơn</h2>
              <div className="mt-4 space-y-2">
                {dashboard.ordersByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span>{getOrderStatusLabel(item.status)}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardPanel title="Đơn gần đây">
              {dashboard.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders?orderId=${order.id}`}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm last:border-b-0"
                >
                  <span>
                    <span className="block font-semibold text-slate-950">{order.orderCode}</span>
                    <span className="block text-slate-500">{order.customerName}</span>
                  </span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(order.totalAmount)}</span>
                </Link>
              ))}
            </DashboardPanel>

            <DashboardPanel title="Tồn kho thấp">
              {dashboard.lowStockItems.map((item) => (
                <div
                  key={item.productVariantId}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm last:border-b-0"
                >
                  <span>
                    <span className="block font-semibold text-slate-950">{item.productName}</span>
                    <span className="block text-slate-500">{item.sku}</span>
                  </span>
                  <span className="font-semibold text-rose-700">
                    {item.stockQuantity}/{item.lowStockThreshold}
                  </span>
                </div>
              ))}
            </DashboardPanel>
          </div>
        </>
      ) : null}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}

function DashboardPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
