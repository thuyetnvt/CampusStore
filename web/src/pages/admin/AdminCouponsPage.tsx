import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PencilLine, Plus, Power, PowerOff } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import {
  createAdminCoupon,
  getAdminCoupons,
  setAdminCouponActive,
  updateAdminCoupon,
  type AdminCouponListItem,
  type AdminCouponUpsertRequest,
  type DiscountType
} from '../../api/adminCoupons';
import { formatCurrency } from '../../utils/format';

const DEFAULT_PAGE_SIZE = 12;

type ActiveFilter = 'all' | 'active' | 'inactive';

type CouponFormState = {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  minimumOrderAmount: string;
  maximumDiscountAmount: string;
  startAt: string;
  endAt: string;
  usageLimit: string;
  isActive: boolean;
};

export function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [editingCoupon, setEditingCoupon] = useState<AdminCouponListItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<CouponFormState>(getEmptyFormState());
  const [formError, setFormError] = useState('');

  const couponsQuery = useQuery({
    queryKey: ['admin-coupons', page, keyword, activeFilter],
    queryFn: () =>
      getAdminCoupons({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        keyword: keyword || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active'
      }),
    retry: false
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: AdminCouponUpsertRequest }) =>
      id === null ? createAdminCoupon(data) : updateAdminCoupon(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      closeForm();
    }
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setAdminCouponActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
  });

  const coupons = couponsQuery.data?.items ?? [];

  function openCreateForm() {
    setEditingCoupon(null);
    setFormState(getEmptyFormState());
    setFormError('');
    setIsFormOpen(true);
  }

  function openEditForm(coupon: AdminCouponListItem) {
    setEditingCoupon(coupon);
    setFormState({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minimumOrderAmount: String(coupon.minimumOrderAmount),
      maximumDiscountAmount: coupon.maximumDiscountAmount === null ? '' : String(coupon.maximumDiscountAmount),
      startAt: toDateTimeLocal(coupon.startAt),
      endAt: toDateTimeLocal(coupon.endAt),
      usageLimit: String(coupon.usageLimit),
      isActive: coupon.isActive
    });
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingCoupon(null);
    setIsFormOpen(false);
    setFormState(getEmptyFormState());
    setFormError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeForm(formState);
    if ('message' in normalized) {
      setFormError(normalized.message);
      return;
    }

    setFormError('');
    try {
      await saveMutation.mutateAsync({
        id: editingCoupon?.id ?? null,
        data: normalized.data
      });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Không thể lưu voucher.'));
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin / Staff</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Quản lý voucher</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tạo, sửa và bật/tắt mã giảm giá cho đơn hàng đủ điều kiện.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm voucher
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-bold text-slate-950">Bộ lọc</h2>
          <div className="mt-4 space-y-4">
            <Field label="Tìm kiếm">
              <input
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Mã voucher"
              />
            </Field>
            <Field label="Trạng thái">
              <select
                value={activeFilter}
                onChange={(event) => {
                  setActiveFilter(event.target.value as ActiveFilter);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang bật</option>
                <option value="inactive">Đang tắt</option>
              </select>
            </Field>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {couponsQuery.isLoading ? 'Đang tải voucher...' : `${couponsQuery.data?.totalItems ?? 0} voucher`}
          </div>

          {couponsQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
          ) : couponsQuery.isError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Không tải được danh sách voucher.
            </div>
          ) : coupons.length ? (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Mã</th>
                      <th className="px-4 py-3">Giảm giá</th>
                      <th className="px-4 py-3">Điều kiện</th>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Lượt dùng</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td className="px-4 py-4 font-semibold text-slate-950">{coupon.code}</td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-950">{formatDiscount(coupon)}</div>
                          {coupon.maximumDiscountAmount !== null ? (
                            <div className="text-xs text-slate-500">Tối đa {formatCurrency(coupon.maximumDiscountAmount)}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-slate-700">Từ {formatCurrency(coupon.minimumOrderAmount)}</td>
                        <td className="px-4 py-4 text-slate-700">
                          <div>{formatDate(coupon.startAt)}</div>
                          <div className="text-slate-500">đến {formatDate(coupon.endAt)}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {coupon.usedCount} / {coupon.usageLimit}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${coupon.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {coupon.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                              onClick={() => openEditForm(coupon)}
                            >
                              <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                              Sửa
                            </button>
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-white ${coupon.isActive ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'}`}
                              onClick={() => activeMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                              disabled={activeMutation.isPending}
                            >
                              {coupon.isActive ? <PowerOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Power className="h-3.5 w-3.5" aria-hidden="true" />}
                              {coupon.isActive ? 'Tắt' : 'Bật'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={couponsQuery.data?.page ?? page}
                totalPages={couponsQuery.data?.totalPages ?? 1}
                onPrevious={() => setPage((value) => Math.max(value - 1, 1))}
                onNext={() => setPage((value) => value + 1)}
              />
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
              <h2 className="text-lg font-bold text-slate-950">Không có voucher phù hợp</h2>
              <p className="mt-2 text-sm text-slate-600">Thử đổi từ khóa hoặc bộ lọc trạng thái.</p>
            </div>
          )}
        </div>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6" onMouseDown={closeForm}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-950">{editingCoupon ? 'Sửa voucher' : 'Tạo voucher'}</h2>
            </div>
            <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <Field label="Mã voucher">
                <input value={formState.code} onChange={(event) => setFormState((current) => ({ ...current, code: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase" />
              </Field>
              <Field label="Loại giảm">
                <select value={formState.discountType} onChange={(event) => setFormState((current) => ({ ...current, discountType: Number(event.target.value) as DiscountType }))} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                  <option value={1}>Giảm tiền</option>
                  <option value={2}>Giảm phần trăm</option>
                </select>
              </Field>
              <Field label="Giá trị giảm">
                <input type="number" min="0" step="0.01" value={formState.discountValue} onChange={(event) => setFormState((current) => ({ ...current, discountValue: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
              <Field label="Đơn tối thiểu">
                <input type="number" min="0" step="0.01" value={formState.minimumOrderAmount} onChange={(event) => setFormState((current) => ({ ...current, minimumOrderAmount: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
              <Field label="Mức giảm tối đa">
                <input type="number" min="0" step="0.01" value={formState.maximumDiscountAmount} onChange={(event) => setFormState((current) => ({ ...current, maximumDiscountAmount: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Để trống nếu không giới hạn" />
              </Field>
              <Field label="Số lượt dùng">
                <input type="number" min="1" value={formState.usageLimit} onChange={(event) => setFormState((current) => ({ ...current, usageLimit: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
              <Field label="Bắt đầu">
                <input type="datetime-local" value={formState.startAt} onChange={(event) => setFormState((current) => ({ ...current, startAt: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
              <Field label="Kết thúc">
                <input type="datetime-local" value={formState.endAt} onChange={(event) => setFormState((current) => ({ ...current, endAt: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={formState.isActive} onChange={(event) => setFormState((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-emerald-700" />
                  Đang bật
                </label>
              </div>
              {formError ? <div className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div> : null}
              <div className="md:col-span-2 flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button type="button" className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold" onClick={closeForm} disabled={saveMutation.isPending}>Hủy</button>
                <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Pagination({ page, totalPages, onPrevious, onNext }: { page: number; totalPages: number; onPrevious: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50" disabled={page <= 1} onClick={onPrevious}>
        Trước
      </button>
      <span className="text-sm text-slate-600">Trang {page} / {totalPages}</span>
      <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50" disabled={page >= totalPages} onClick={onNext}>
        Sau
      </button>
    </div>
  );
}

function getEmptyFormState(): CouponFormState {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);
  return {
    code: '',
    discountType: 1,
    discountValue: '',
    minimumOrderAmount: '0',
    maximumDiscountAmount: '',
    startAt: toDateTimeLocal(now.toISOString()),
    endAt: toDateTimeLocal(nextMonth.toISOString()),
    usageLimit: '100',
    isActive: true
  };
}

function normalizeForm(state: CouponFormState): { data: AdminCouponUpsertRequest } | { message: string } {
  const code = state.code.trim().toUpperCase();
  const discountValue = Number(state.discountValue);
  const minimumOrderAmount = Number(state.minimumOrderAmount);
  const maximumDiscountAmount = state.maximumDiscountAmount.trim() === '' ? null : Number(state.maximumDiscountAmount);
  const usageLimit = Number(state.usageLimit);
  const startAt = new Date(state.startAt);
  const endAt = new Date(state.endAt);

  if (!code) {
    return { message: 'Mã voucher không được để trống.' };
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { message: 'Giá trị giảm phải lớn hơn 0.' };
  }
  if (state.discountType === 2 && discountValue > 100) {
    return { message: 'Phần trăm giảm không được vượt quá 100%.' };
  }
  if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) {
    return { message: 'Đơn tối thiểu không được nhỏ hơn 0.' };
  }
  if (maximumDiscountAmount !== null && (!Number.isFinite(maximumDiscountAmount) || maximumDiscountAmount <= 0)) {
    return { message: 'Mức giảm tối đa phải lớn hơn 0.' };
  }
  if (!Number.isInteger(usageLimit) || usageLimit <= 0) {
    return { message: 'Số lượt sử dụng phải lớn hơn 0.' };
  }
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
    return { message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' };
  }

  return {
    data: {
      code,
      discountType: state.discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscountAmount,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      usageLimit,
      isActive: state.isActive
    }
  };
}

function formatDiscount(coupon: AdminCouponListItem) {
  return coupon.discountType === 2 ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message;
    }
    return error.message || fallback;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
