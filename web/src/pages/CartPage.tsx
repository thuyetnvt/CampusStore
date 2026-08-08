import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { clearCart, deleteCartItem, getCart, updateCartItem } from '../api/cart';
import { formatCurrency } from '../utils/format';

export function CartPage() {
  const queryClient = useQueryClient();
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});
  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    retry: false
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => updateCartItem(id, quantity),
    onMutate: ({ id }) => {
      setItemErrors((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    },
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart),
    onError: (error, variables) => {
      setItemErrors((current) => ({
        ...current,
        [variables.id]: getBackendErrorMessage(error)
      }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCartItem,
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart)
  });

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  const busy = updateMutation.isPending || deleteMutation.isPending || clearMutation.isPending;

  if (cartQuery.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-950">Giỏ hàng</h1>
        <div className="mt-6 h-40 rounded-md bg-slate-100" />
      </section>
    );
  }

  if (cartQuery.isError) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-950">Giỏ hàng</h1>
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
          Bạn cần đăng nhập để xem giỏ hàng.
        </div>
      </section>
    );
  }

  const cart = cartQuery.data;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Giỏ hàng</h1>
          <p className="mt-2 text-sm text-slate-600">Dùng nút tăng/giảm để đổi số lượng, hệ thống sẽ kiểm tra tồn kho trước khi cập nhật.</p>
        </div>
        {cart?.items.length ? (
          <button
            type="button"
            onClick={() => clearMutation.mutate()}
            disabled={busy}
            className="rounded-md border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Xóa giỏ hàng
          </button>
        ) : null}
      </div>

      {!cart?.items.length ? (
        <div className="mt-6 rounded-md border border-slate-200 bg-white px-4 py-10 text-center">
          <div className="mx-auto max-w-md">
            <p className="text-lg font-semibold text-slate-900">Giỏ hàng đang trống</p>
            <p className="mt-2 text-sm text-slate-600">
              Chưa có sản phẩm nào trong giỏ. Hãy chọn vài món trước khi thanh toán.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-flex items-center rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {cart.items.map((item) => {
              const itemUpdating = updateMutation.isPending && updateMutation.variables?.id === item.id;
              const itemError = itemErrors[item.id];
              const canDecrease = item.quantity > 1 && !itemUpdating;
              const canIncrease = item.quantity < item.stockQuantity && !itemUpdating;

              return (
                <article key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="grid gap-4 sm:grid-cols-[96px_1fr_auto]">
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-emerald-50 text-center text-xs font-semibold text-emerald-800"
                    >
                      {item.primaryImageUrl ? (
                        <img src={item.primaryImageUrl} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        item.productName
                      )}
                    </Link>
                    <div>
                      <Link to={`/products/${item.productSlug}`} className="font-semibold hover:text-emerald-700">
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">SKU: {item.sku}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {[item.color, item.size].filter(Boolean).join(' • ') || 'Mặc định'}
                      </p>
                      <p className="mt-2 font-semibold text-emerald-700">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <div className="flex items-center rounded-md border border-slate-300">
                        <button
                          type="button"
                          disabled={!canDecrease}
                          onClick={() => updateMutation.mutate({ id: item.id, quantity: item.quantity - 1 })}
                          className="px-3 py-1 text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Giảm số lượng ${item.productName}`}
                        >
                          -
                        </button>
                        <span className="min-w-10 px-3 py-1 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={!canIncrease}
                          onClick={() => updateMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                          className="px-3 py-1 text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Tăng số lượng ${item.productName}`}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">Tồn kho: {item.stockQuantity}</p>
                      <p className="text-sm font-semibold">{formatCurrency(item.lineTotal)}</p>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={busy}
                        className="rounded-md p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Xóa ${item.productName}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  {itemUpdating ? <p className="mt-3 text-xs text-slate-500">Đang cập nhật số lượng...</p> : null}
                  {itemError ? <p className="mt-2 text-sm text-rose-700">{itemError}</p> : null}
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-950">Tóm tắt giỏ hàng</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Số lượng</span>
                <span>{cart.totalQuantity}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Tạm tính</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="mt-5 block rounded-md bg-emerald-700 px-4 py-2 text-center font-semibold text-white hover:bg-emerald-800"
            >
              Đi tới thanh toán
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}

function getBackendErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data && typeof data === 'object') {
      if ('message' in data && typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }

      if ('title' in data && typeof data.title === 'string' && data.title.trim()) {
        return data.title;
      }
    }
  }

  return 'Không cập nhật được số lượng sản phẩm.';
}
