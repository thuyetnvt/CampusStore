import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardList, Search, Truck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { getAdminOrder, getAdminOrders, updateAdminOrderStatus } from '../api/adminOrders';
import { formatCurrency } from '../utils/format';
import { OrderStatus, PaymentStatus } from '../types/order';

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'Chờ xác nhận',
  [OrderStatus.Confirmed]: 'Đã xác nhận',
  [OrderStatus.Preparing]: 'Đang chuẩn bị',
  [OrderStatus.Shipping]: 'Đang giao',
  [OrderStatus.Completed]: 'Hoàn tất',
  [OrderStatus.Cancelled]: 'Đã hủy'
};

const paymentLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: 'Chưa thanh toán',
  [PaymentStatus.Pending]: 'Đang xử lý',
  [PaymentStatus.Paid]: 'Đã thanh toán',
  [PaymentStatus.Failed]: 'Thất bại',
  [PaymentStatus.Refunded]: 'Đã hoàn tiền'
};

const nextStatuses: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Preparing, OrderStatus.Cancelled],
  [OrderStatus.Preparing]: [OrderStatus.Shipping, OrderStatus.Cancelled],
  [OrderStatus.Shipping]: [OrderStatus.Completed]
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function statusIcon(status: OrderStatus) {
  if (status === OrderStatus.Cancelled) {
    return <XCircle className="h-4 w-4" aria-hidden="true" />;
  }

  if (status === OrderStatus.Completed) {
    return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  }

  if (status === OrderStatus.Shipping) {
    return <Truck className="h-4 w-4" aria-hidden="true" />;
  }

  return <ClipboardList className="h-4 w-4" aria-hidden="true" />;
}

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<number>(0);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['admin-orders', status, keyword],
    queryFn: () => getAdminOrders(1, status ? (status as OrderStatus) : undefined, keyword || undefined),
    retry: false
  });

  const activeOrderId = selectedOrderId ?? ordersQuery.data?.items[0]?.id ?? null;

  const detailQuery = useQuery({
    queryKey: ['admin-order', activeOrderId],
    queryFn: () => getAdminOrder(activeOrderId ?? 0),
    enabled: activeOrderId !== null,
    retry: false
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: OrderStatus }) =>
      updateAdminOrderStatus(id, nextStatus, `Cập nhật trạng thái sang ${statusLabels[nextStatus]}.`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order', activeOrderId] });
    }
  });

  const orders = ordersQuery.data?.items ?? [];
  const detail = detailQuery.data;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Quản lý đơn hàng</h1>
          <p className="mt-2 text-sm text-slate-600">Nhận đơn, chuẩn bị, giao hàng và cập nhật trạng thái.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="flex items-center rounded-md border border-slate-300 bg-white px-3">
          <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setSelectedOrderId(null);
            }}
            className="w-full border-0 px-3 py-2 outline-none"
            placeholder="Tìm mã đơn, tên, số điện thoại"
          />
        </label>
        <select
          value={status}
          onChange={(event) => {
            setStatus(Number(event.target.value));
            setSelectedOrderId(null);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2"
        >
          <option value={0}>Tất cả trạng thái</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {ordersQuery.isError ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
          Bạn cần đăng nhập bằng tài khoản Staff hoặc Admin để quản lý đơn hàng.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {ordersQuery.isLoading ? <div className="h-48 bg-slate-100" /> : null}
            {!ordersQuery.isLoading && !orders.length ? (
              <div className="px-4 py-8 text-center text-sm text-slate-600">Không có đơn hàng phù hợp.</div>
            ) : null}
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                className={`grid w-full gap-3 border-b border-slate-100 px-4 py-4 text-left hover:bg-slate-50 md:grid-cols-[1.1fr_1fr_auto] ${
                activeOrderId === order.id ? 'bg-emerald-50' : ''
              }`}
            >
                <span>
                  <span className="block font-semibold text-slate-950">{order.orderCode}</span>
                  <span className="mt-1 block text-sm text-slate-500">{formatDate(order.createdAt)}</span>
                  <span className="mt-1 block text-sm text-slate-500">{order.customerName}</span>
                </span>
                <span className="text-sm">
                  <span className="flex items-center gap-1 font-medium text-slate-900">
                    {statusIcon(order.orderStatus)}
                    {statusLabels[order.orderStatus]}
                  </span>
                  <span className="mt-1 block text-slate-500">{paymentLabels[order.paymentStatus]}</span>
                </span>
                <span className="text-sm font-semibold text-emerald-700">{formatCurrency(order.totalAmount)}</span>
              </button>
            ))}
          </div>

          <aside className="h-fit rounded-md border border-slate-200 bg-white p-4">
            {detailQuery.isLoading ? <div className="h-60 rounded-md bg-slate-100" /> : null}
            {!detailQuery.isLoading && !detail ? (
              <div className="text-sm text-slate-600">Chọn một đơn hàng để xem chi tiết.</div>
            ) : null}
            {detail ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">{detail.orderCode}</h2>
                    <p className="mt-1 text-sm text-slate-500">{detail.customerName}</p>
                    <p className="text-sm text-slate-500">{detail.customerEmail}</p>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-sm font-medium text-emerald-800">
                    {statusLabels[detail.orderStatus]}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">{detail.receiverName}</div>
                  <div>{detail.receiverPhone}</div>
                  <div>{detail.shippingAddress}</div>
                </div>

                <div className="mt-4 space-y-2">
                  {detail.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 text-sm">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-emerald-50 text-[10px] font-semibold text-emerald-800">
                        {item.primaryImageUrl ? (
                          <img src={item.primaryImageUrl} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          item.productName
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-slate-500">x{item.quantity} - {item.variantDescription || 'Mặc định'}</div>
                      </div>
                      <div className="font-semibold">{formatCurrency(item.lineTotal)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span>{formatCurrency(detail.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(detail.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span>{formatCurrency(detail.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span>Tổng</span>
                    <span>{formatCurrency(detail.totalAmount)}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(nextStatuses[detail.orderStatus] ?? []).map((nextStatus) => (
                    <button
                      key={nextStatus}
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: detail.id, nextStatus })}
                      className={`rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                        nextStatus === OrderStatus.Cancelled
                          ? 'bg-rose-700 hover:bg-rose-800'
                          : 'bg-emerald-700 hover:bg-emerald-800'
                      }`}
                    >
                      {statusLabels[nextStatus]}
                    </button>
                  ))}
                </div>

                {statusMutation.isError ? (
                  <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    Không cập nhật được trạng thái đơn hàng.
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  );
}
