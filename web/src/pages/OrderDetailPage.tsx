import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { cancelOrder, createReview, getOrder } from '../api/orders';
import { formatCurrency } from '../utils/format';
import { OrderStatus } from '../types/order';
import type { OrderItem } from '../types/order';
import { customerCancellableStatuses, getOrderStatusLabel } from '../utils/orderStatus';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function ReviewForm({ item, orderId }: { item: OrderItem; orderId: number }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const reviewMutation = useMutation({
    mutationFn: () => createReview({ orderItemId: item.id, rating, comment: comment || undefined }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    }
  });

  if (item.hasReview) {
    return <span className="text-sm text-slate-500">Đã đánh giá</span>;
  }

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} sao
            </option>
          ))}
        </select>
        <input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-1 text-sm"
          placeholder="Nhận xét ngắn"
        />
        <button
          type="button"
          disabled={reviewMutation.isPending}
          onClick={() => reviewMutation.mutate()}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          <Star className="h-4 w-4" aria-hidden="true" />
          Gửi
        </button>
      </div>
      {reviewMutation.isError ? <p className="mt-2 text-sm text-rose-700">Không gửi được đánh giá.</p> : null}
    </div>
  );
}

export function OrderDetailPage() {
  const queryClient = useQueryClient();
  const params = useParams();
  const orderId = Number(params.id);

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
    enabled: Number.isFinite(orderId),
    retry: false
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId, 'Khách hàng hủy từ trang chi tiết đơn hàng.'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  if (orderQuery.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-48 rounded-md bg-slate-100" />
      </section>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <Link to="/orders" className="text-sm text-emerald-700 hover:underline">
          Quay lại đơn hàng
        </Link>
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
          Không tìm thấy đơn hàng hoặc bạn chưa đăng nhập.
        </div>
      </section>
    );
  }

  const order = orderQuery.data;
  const canCancel = customerCancellableStatuses.includes(order.orderStatus);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/orders" className="text-sm text-emerald-700 hover:underline">
        Quay lại đơn hàng
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{order.orderCode}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {formatDate(order.createdAt)} - {getOrderStatusLabel(order.orderStatus)}
          </p>
        </div>
        {canCancel ? (
          <button
            type="button"
            disabled={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-md border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Hủy đơn
          </button>
        ) : null}
      </div>

      {cancelMutation.isError ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Không hủy được đơn hàng ở trạng thái hiện tại.
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-950">Sản phẩm</h2>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <article key={item.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="grid gap-4 sm:grid-cols-[80px_1fr_auto]">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-emerald-50 text-center text-xs font-semibold text-emerald-800">
                      {item.primaryImageUrl ? (
                        <img src={item.primaryImageUrl} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        item.productName
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{item.productName}</div>
                      <div className="mt-1 text-sm text-slate-500">SKU: {item.sku}</div>
                      <div className="mt-1 text-sm text-slate-500">{item.variantDescription || 'Mặc định'}</div>
                      {order.orderStatus === OrderStatus.Completed ? <ReviewForm item={item} orderId={order.id} /> : null}
                    </div>
                    <div className="text-sm sm:text-right">
                      <div>
                        {formatCurrency(item.unitPrice)} x {item.quantity}
                      </div>
                      <div className="mt-1 font-semibold text-emerald-700">{formatCurrency(item.lineTotal)}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-950">Trạng thái</h2>
            <div className="mt-4 space-y-3">
              {order.statusHistories.map((history) => (
                <div key={`${history.createdAt}-${history.newStatus}`} className="text-sm">
                  <div className="font-medium">{getOrderStatusLabel(history.newStatus)}</div>
                  <div className="text-slate-500">{formatDate(history.createdAt)}</div>
                  {history.note ? <div className="text-slate-500">{history.note}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-950">Thông tin đơn hàng</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="font-medium text-slate-900">{order.receiverName}</div>
            <div>{order.receiverPhone}</div>
            <div>{order.shippingAddress}</div>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Giảm giá</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
              <span>Tổng</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
