import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilLine } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { getCategories } from '../../api/catalog';
import { getAdminInventory, updateAdminInventoryItem, type AdminInventoryItem, type AdminInventoryUpdateRequest } from '../../api/adminInventory';
import { formatCurrency } from '../../utils/format';

const DEFAULT_PAGE_SIZE = 12;

type InventoryFormState = {
  stockQuantity: string;
  lowStockThreshold: string;
  isActive: boolean;
  reason: string;
};

export function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockState, setStockState] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingItem, setEditingItem] = useState<AdminInventoryItem | null>(null);
  const [formState, setFormState] = useState<InventoryFormState>(getEmptyFormState());
  const [formError, setFormError] = useState('');

  const categoriesQuery = useQuery({ queryKey: ['admin-inventory-categories'], queryFn: () => getCategories() });
  const inventoryQuery = useQuery({
    queryKey: ['admin-inventory', page, keyword, categoryId, stockState, activeFilter],
    queryFn: () =>
      getAdminInventory({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        keyword: keyword || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        stockState: stockState === 'all' ? undefined : stockState,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active'
      }),
    retry: false
  });

  const saveMutation = useMutation({
    mutationFn: ({ variantId, payload }: { variantId: number; payload: AdminInventoryUpdateRequest }) =>
      updateAdminInventoryItem(variantId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      setEditingItem(null);
      setFormError('');
    }
  });

  function openEditForm(item: AdminInventoryItem) {
    setEditingItem(item);
    setFormState({
      stockQuantity: String(item.stockQuantity),
      lowStockThreshold: String(item.lowStockThreshold),
      isActive: item.isActive,
      reason: ''
    });
    setFormError('');
  }

  function closeForm() {
    setEditingItem(null);
    setFormState(getEmptyFormState());
    setFormError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem) {
      return;
    }

    const stockQuantity = Number(formState.stockQuantity);
    const lowStockThreshold = Number(formState.lowStockThreshold);
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      setFormError('Tồn kho phải là số không âm.');
      return;
    }
    if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
      setFormError('Ngưỡng cảnh báo phải là số không âm.');
      return;
    }

    setFormError('');
    await saveMutation.mutateAsync({
      variantId: editingItem.productVariantId,
      payload: {
        stockQuantity,
        lowStockThreshold,
        isActive: formState.isActive,
        reason: formState.reason.trim() || null
      }
    });
  }

  const items = inventoryQuery.data?.items ?? [];

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin / Staff</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Quản lý tồn kho</h1>
        <p className="mt-2 text-sm text-slate-600">Theo dõi SKU, số lượng hiện tại, ngưỡng cảnh báo và trạng thái còn hàng.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-bold text-slate-950">Bộ lọc</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tìm kiếm</span>
              <input value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Tên, SKU, màu, size" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Danh mục</span>
              <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">Tất cả</option>
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Trạng thái kho</span>
              <select value={stockState} onChange={(event) => { setStockState(event.target.value as typeof stockState); setPage(1); }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="all">Tất cả</option>
                <option value="in_stock">Còn hàng</option>
                <option value="low_stock">Sắp hết</option>
                <option value="out_of_stock">Hết hàng</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Bật/tắt</span>
              <select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value as typeof activeFilter); setPage(1); }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="all">Tất cả</option>
                <option value="active">Đang bật</option>
                <option value="inactive">Đang tắt</option>
              </select>
            </label>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {inventoryQuery.isLoading ? 'Đang tải tồn kho...' : `${inventoryQuery.data?.totalItems ?? 0} biến thể`}
          </div>
          {inventoryQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
          ) : inventoryQuery.isError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Không tải được danh sách tồn kho.</div>
          ) : items.length ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Giá</th>
                    <th className="px-4 py-3">Tồn kho</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.productVariantId}>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-950">{item.productName}</div>
                        <div className="text-slate-500">{item.categoryName}</div>
                        <div className="text-xs text-slate-400">{[item.color, item.size].filter(Boolean).join(' - ') || 'Mặc định'}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{item.sku}</td>
                      <td className="px-4 py-4 font-semibold text-slate-950">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-950">{item.stockQuantity}</div>
                        <div className="text-xs text-slate-500">Ngưỡng: {item.lowStockThreshold}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <StatusPill label={item.stockStatus} />
                          <StatusPill label={item.isActive ? 'Đang bật' : 'Đang tắt'} active={item.isActive} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                          onClick={() => openEditForm(item)}
                        >
                          <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                          Điều chỉnh
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
              <h2 className="text-lg font-bold text-slate-950">Không có biến thể phù hợp</h2>
              <p className="mt-2 text-sm text-slate-600">Thử thay đổi bộ lọc để xem tồn kho khác.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <PagerButton label="Trước" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} />
        <span className="text-sm text-slate-600">Trang {inventoryQuery.data?.page ?? page} / {inventoryQuery.data?.totalPages ?? 1}</span>
        <PagerButton label="Sau" disabled={page >= (inventoryQuery.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)} />
      </div>

      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6" onMouseDown={closeForm}>
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-950">Điều chỉnh tồn kho</h2>
            </div>
            <form className="space-y-4 p-5" onSubmit={handleSubmit}>
              <Field label="Tên sản phẩm">{editingItem.productName}</Field>
              <Field label="SKU">{editingItem.sku}</Field>
              <Field label="Tồn kho">
                <input type="number" min="0" value={formState.stockQuantity} onChange={(event) => setFormState((current) => ({ ...current, stockQuantity: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
              <Field label="Ngưỡng cảnh báo">
                <input type="number" min="0" value={formState.lowStockThreshold} onChange={(event) => setFormState((current) => ({ ...current, lowStockThreshold: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={formState.isActive} onChange={(event) => setFormState((current) => ({ ...current, isActive: event.target.checked }))} />
                Đang bật
              </label>
              <Field label="Lý do điều chỉnh">
                <textarea value={formState.reason} onChange={(event) => setFormState((current) => ({ ...current, reason: event.target.value }))} rows={4} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
              {formError ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div> : null}
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button type="button" className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold" onClick={closeForm}>Hủy</button>
                <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <div className="text-sm text-slate-900">{children}</div>
    </label>
  );
}

function PagerButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50" disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}

function StatusPill({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{label}</span>
  );
}

function getEmptyFormState(): InventoryFormState {
  return {
    stockQuantity: '0',
    lowStockThreshold: '0',
    isActive: true,
    reason: ''
  };
}
