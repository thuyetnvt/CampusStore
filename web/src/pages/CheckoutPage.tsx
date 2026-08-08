import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { createOrder, previewCheckout } from '../api/checkout';
import { formatCurrency } from '../utils/format';
import type { AuthUser } from '../types/auth';

export function CheckoutPage() {
  const queryClient = useQueryClient();
  const cachedUser = queryClient.getQueryData<AuthUser>(['me']);
  const [couponCode, setCouponCode] = useState('');
  const [receiverName, setReceiverName] = useState(() => cachedUser?.fullName ?? '');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const previewQuery = useQuery({
    queryKey: ['checkout-preview', couponCode],
    queryFn: () => previewCheckout(couponCode || undefined),
    retry: false
  });

  const createOrderMutation = useMutation({
    mutationFn: (request: {
      receiverName: string;
      receiverPhone: string;
      shippingAddress: string;
      paymentMethod: number;
      couponCode?: string;
    }) => createOrder(request),
    onMutate: () => {
      setSubmitted(true);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const validation = useMemo(() => getValidationState(receiverName, receiverPhone, shippingAddress), [
    receiverName,
    receiverPhone,
    shippingAddress
  ]);

  const canSubmit = Boolean(previewQuery.data) && validation.isValid && !createOrderMutation.isPending;
  const showErrors = submitted || Boolean(receiverName || receiverPhone || shippingAddress);
  const previewErrorMessage = getBackendErrorMessage(previewQuery.error);
  const submitErrorMessage = getBackendErrorMessage(createOrderMutation.error);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (!validation.isValid || !previewQuery.data || createOrderMutation.isPending) {
      return;
    }

    createOrderMutation.mutate({
        receiverName,
        receiverPhone,
        shippingAddress,
        paymentMethod,
        couponCode: couponCode || undefined
    });
  }

  if (previewQuery.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-950">Thanh toán</h1>
        <div className="mt-6 h-40 rounded-md bg-slate-100" />
      </section>
    );
  }

  if (previewQuery.isError) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-950">Thanh toán</h1>
        <div className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
          {previewErrorMessage}
        </div>
        <Link to="/products" className="mt-4 inline-block text-emerald-700 hover:underline">
          Quay lại mua sắm
        </Link>
      </section>
    );
  }

  const preview = previewQuery.data;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-950">Thanh toán</h1>
      <p className="mt-2 text-sm text-slate-600">Backend tính lại toàn bộ giá, mã giảm giá, phí vận chuyển và tổng thanh toán.</p>

      {createOrderMutation.data ? (
        <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-5 text-emerald-800">
          Đặt hàng thành công. Mã đơn: <strong>{createOrderMutation.data.orderCode}</strong>
          <Link
            to={`/orders/${createOrderMutation.data.id}`}
            className="ml-3 font-semibold text-emerald-900 underline"
          >
            Xem đơn hàng
          </Link>
        </div>
      ) : null}

      <form className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-950">Thông tin nhận hàng</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Người nhận</span>
                <input
                  value={receiverName}
                  onChange={(event) => setReceiverName(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  autoComplete="name"
                />
                {showErrors && validation.name ? <p className="mt-1 text-xs text-rose-600">{validation.name}</p> : null}
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Số điện thoại</span>
                <input
                  value={receiverPhone}
                  onChange={(event) => setReceiverPhone(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  inputMode="tel"
                  autoComplete="tel"
                />
                {showErrors && validation.phone ? <p className="mt-1 text-xs text-rose-600">{validation.phone}</p> : null}
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">Địa chỉ giao hàng</span>
                <textarea
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                  autoComplete="shipping street-address"
                />
                {showErrors && validation.address ? <p className="mt-1 text-xs text-rose-600">{validation.address}</p> : null}
              </label>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-950">Sản phẩm</h2>
            <div className="mt-4 space-y-3">
              {preview?.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm">
                  <div>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-slate-500">x{item.quantity}</div>
                  </div>
                  <div className="font-semibold">{formatCurrency(item.lineTotal)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-950">Thanh toán</h2>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium">Mã giảm giá</span>
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="STUDENT10"
            />
          </label>
          {preview?.couponMessage ? (
            <p className="mt-2 text-sm text-slate-500">{preview.couponMessage}</p>
          ) : null}
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium">Phương thức thanh toán</span>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(Number(event.target.value))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value={1}>COD</option>
              <option value={2}>Chuyển khoản mô phỏng</option>
            </select>
          </label>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>{formatCurrency(preview?.subtotal ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Giảm giá</span>
              <span>-{formatCurrency(preview?.discountAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(preview?.shippingFee ?? 0)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
              <span>Tổng thanh toán</span>
              <span>{formatCurrency(preview?.totalAmount ?? 0)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-5 w-full rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {createOrderMutation.isPending ? 'Đang đặt hàng...' : 'Xác nhận đặt hàng'}
          </button>
          {createOrderMutation.isError ? (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {submitErrorMessage}
            </div>
          ) : null}
        </aside>
      </form>
    </section>
  );
}

function getValidationState(receiverName: string, receiverPhone: string, shippingAddress: string) {
  const name = receiverName.trim().length > 0 ? '' : 'Tên người nhận không được để trống.';
  const normalizedPhone = normalizeVietnamesePhone(receiverPhone);
  const phone = normalizedPhone ? '' : 'Số điện thoại không hợp lệ.';
  const addressText = shippingAddress.trim();
  const address =
    addressText.length >= 10 ? '' : 'Địa chỉ giao hàng phải có ít nhất 10 ký tự.';

  return {
    name,
    phone,
    address,
    isValid: !name && !phone && !address
  };
}

function normalizeVietnamesePhone(value: string) {
  const normalized = value.trim().replace(/[\s.-]/g, '');
  return /^(?:0(?:3|5|7|8|9)\d{8}|\+84(?:3|5|7|8|9)\d{8})$/.test(normalized);
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

      if ('errors' in data && data.errors && typeof data.errors === 'object') {
        const firstError = Object.values(data.errors as Record<string, unknown>)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .find((value) => typeof value === 'string' && value.trim());

        if (typeof firstError === 'string') {
          return firstError;
        }
      }
    }
  }

  return 'Không tạo được đơn hàng.';
}
