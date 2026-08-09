import { useQuery } from '@tanstack/react-query';
import { PackageSearch } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { getOrders } from '../api/orders';
import { formatCurrency } from '../utils/format';
import { PaymentStatus } from '../types/order';
import { getOrderStatusLabel } from '../utils/orderStatus';

const paymentLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: 'Chưa thanh toán',
  [PaymentStatus.Pending]: 'Đang xử lý',
  [PaymentStatus.Paid]: 'Đã thanh toán',
  [PaymentStatus.Failed]: 'Thất bại',
  [PaymentStatus.Refunded]: 'Đã hoàn tiền'
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1);
  const pageSize = 10;

  const ordersQuery = useQuery({
    queryKey: ['orders', page, pageSize],
    queryFn: () => getOrders(page, pageSize),
    retry: false
  });

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    setSearchParams(params);
  }

  if (ordersQuery.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-950">Đơn hàng của tôi</h1>
        <div className="mt-6 h-48 rounded-md bg-slate-100" />
      </section>
    );
  }

  if (ordersQuery.isError) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-950">Đơn hàng của tôi</h1>
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
          Bạn cần đăng nhập để xem lịch sử đơn hàng.
        </div>
      </section>
    );
  }

  const orders = ordersQuery.data?.items ?? [];
  const totalItems = ordersQuery.data?.totalItems ?? 0;
  const totalPages = ordersQuery.data?.totalPages ?? 1;
  const currentPage = ordersQuery.data?.page ?? page;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Đơn hàng của tôi</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tổng số đơn: {totalItems}. Theo dõi trạng thái, hủy đơn sớm và đánh giá sản phẩm đã mua.
          </p>
        </div>
        <PackageSearch className="hidden h-8 w-8 text-emerald-700 sm:block" aria-hidden="true" />
      </div>

      {!orders.length ? (
        <div className="mt-6 rounded-md border border-slate-200 bg-white px-4 py-8 text-center">
          <p className="font-medium text-slate-700">Chưa có đơn hàng nào.</p>
          <Link to="/products" className="mt-3 inline-block text-emerald-700 hover:underline">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="grid gap-3 border-b border-slate-100 px-4 py-4 hover:bg-slate-50 md:grid-cols-[1.2fr_1fr_1fr_auto]"
            >
              <div>
                <div className="font-semibold text-slate-950">{order.orderCode}</div>
                <div className="mt-1 text-sm text-slate-500">{formatDate(order.createdAt)}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">{getOrderStatusLabel(order.orderStatus)}</div>
                <div className="mt-1 text-slate-500">{order.totalQuantity} sản phẩm</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold text-emerald-700">{formatCurrency(order.totalAmount)}</div>
                <div className="mt-1 text-slate-500">Thanh toán: {paymentLabels[order.paymentStatus]}</div>
              </div>
              <span className="self-center text-sm font-medium text-emerald-700">Chi tiết</span>
            </Link>
          ))}
        </div>
      )}

      {orders.length ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trang trước
          </button>
          <div className="text-sm text-slate-600">
            Trang {currentPage} / {totalPages}
          </div>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      ) : null}
    </section>
  );
}
