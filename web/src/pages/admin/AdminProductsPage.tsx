import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PencilLine, Plus, PowerOff, Power } from 'lucide-react';
import { useRef, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react';
import { getCategories } from '../../api/catalog';
import {
  createAdminProduct,
  getAdminProducts,
  setAdminProductActive,
  updateAdminProduct,
  type AdminProductListItem,
  type AdminProductUpsertRequest
} from '../../api/adminProducts';
import { formatCurrency } from '../../utils/format';

type ActiveFilter = 'all' | 'active' | 'inactive';

type ProductFormState = {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  basePrice: string;
  salePrice: string;
  isActive: boolean;
};

const DEFAULT_PAGE_SIZE = 12;
const DEBOUNCE_MS = 400;

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const searchTimerRef = useRef<number | null>(null);
  const [page, setPage] = useState(1);
  const [keywordInput, setKeywordInput] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductListItem | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(getEmptyFormState());
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProductFormState, string>>>({});

  const categoriesQuery = useQuery({
    queryKey: ['admin-product-categories'],
    queryFn: getCategories
  });

  const productsQuery = useQuery({
    queryKey: ['admin-products', page, keywordFilter, categoryFilter, activeFilter],
    queryFn: () =>
      getAdminProducts({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        keyword: keywordFilter || undefined,
        categoryId: categoryFilter ? Number(categoryFilter) : undefined,
        isActive:
          activeFilter === 'all' ? undefined : activeFilter === 'active'
      }),
    retry: false
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: number | null; data: AdminProductUpsertRequest }) =>
      payload.id === null
        ? createAdminProduct(payload.data)
        : updateAdminProduct(payload.id, payload.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeForm();
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setAdminProductActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  });

  function handleSearchChange(value: string) {
    setKeywordInput(value);
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      setKeywordFilter(value.trim());
      setPage(1);
    }, DEBOUNCE_MS);
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value);
    setPage(1);
  }

  function handleActiveChange(value: ActiveFilter) {
    setActiveFilter(value);
    setPage(1);
  }

  function openCreateForm() {
    setEditingProduct(null);
    setFormState(getEmptyFormState());
    setFieldErrors({});
    setFormError('');
    setIsFormOpen(true);
  }

  function openEditForm(product: AdminProductListItem) {
    setEditingProduct(product);
    setFormState({
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId.toString(),
      description: product.description,
      basePrice: String(product.basePrice),
      salePrice: product.salePrice === null ? '' : String(product.salePrice),
      isActive: product.isActive
    });
    setFieldErrors({});
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormState(getEmptyFormState());
    setFormError('');
    setFieldErrors({});
  }

  function clearFilters() {
    setKeywordInput('');
    setKeywordFilter('');
    setCategoryFilter('');
    setActiveFilter('all');
    setPage(1);
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = validateForm(formState);
    if (normalized.errors) {
      setFieldErrors(normalized.errors);
      setFormError(normalized.message);
      return;
    }

    setFieldErrors({});
    setFormError('');

    try {
      await saveMutation.mutateAsync({
        id: editingProduct?.id ?? null,
        data: normalized.data
      });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  }

  const products = productsQuery.data?.items ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin / Staff</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Quản lý sản phẩm</h1>
          <p className="mt-2 text-sm text-slate-600">Tìm kiếm, lọc, tạo mới, sửa và bật/tắt sản phẩm.</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm sản phẩm
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-950">Bộ lọc</h2>
            <button type="button" className="text-sm font-semibold text-emerald-700 hover:underline" onClick={clearFilters}>
              Xóa hết
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Tìm kiếm">
              <input
                value={keywordInput}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Tên, slug, mô tả"
              />
            </Field>

            <Field label="Danh mục">
              <select
                value={categoryFilter}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Tất cả danh mục</option>
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Trạng thái">
              <select
                value={activeFilter}
                onChange={(event) => handleActiveChange(event.target.value as ActiveFilter)}
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
            {productsQuery.isLoading ? 'Đang tải sản phẩm...' : `${productsQuery.data?.totalItems ?? 0} sản phẩm`}
          </div>

          {productsQuery.isLoading ? (
            <ProductSkeleton />
          ) : productsQuery.isError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Không tải được danh sách sản phẩm.
            </div>
          ) : products.length ? (
            <>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr_0.6fr_0.9fr] gap-3 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Sản phẩm</span>
                  <span>Danh mục</span>
                  <span>Giá</span>
                  <span>Trạng thái</span>
                  <span>Thao tác</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <div key={product.id} className="grid grid-cols-[1.8fr_0.8fr_0.8fr_0.6fr_0.9fr] gap-3 px-4 py-4 text-sm">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-950">{product.name}</div>
                        <div className="truncate text-slate-500">{product.slug}</div>
                        <div className="mt-1 text-slate-500">
                          {product.variantCount} biến thể · {product.totalStock} tồn kho
                        </div>
                      </div>
                      <div className="text-slate-700">{product.categoryName}</div>
                      <div>
                        <div className="font-semibold text-slate-950">{formatCurrency(product.salePrice ?? product.basePrice)}</div>
                        {product.salePrice !== null ? (
                          <div className="text-xs text-slate-500 line-through">{formatCurrency(product.basePrice)}</div>
                        ) : null}
                      </div>
                      <div>
                        <StatusPill active={product.isActive} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                          onClick={() => openEditForm(product)}
                        >
                          <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-white ${
                            product.isActive ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'
                          }`}
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: product.id, isActive: !product.isActive })
                          }
                          disabled={toggleActiveMutation.isPending}
                        >
                          {product.isActive ? (
                            <>
                              <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />
                              Tắt
                            </>
                          ) : (
                            <>
                              <Power className="h-3.5 w-3.5" aria-hidden="true" />
                              Bật
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <PageButton label="Trước" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} />
                <span className="text-sm text-slate-600">
                  Trang {productsQuery.data?.page ?? page} / {productsQuery.data?.totalPages ?? 1}
                </span>
                <PageButton
                  label="Sau"
                  disabled={page >= (productsQuery.data?.totalPages ?? 1)}
                  onClick={() => setPage((value) => value + 1)}
                />
              </div>
            </>
          ) : (
            <EmptyState onClear={clearFilters} />
          )}
        </div>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6" onMouseDown={closeForm}>
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-950">
                {editingProduct ? 'Sửa sản phẩm' : 'Tạo sản phẩm'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">Điền thông tin cơ bản cho sản phẩm.</p>
            </div>

            <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <Field label="Tên sản phẩm" error={fieldErrors.name}>
                <input
                  value={formState.name}
                  onChange={(event) => updateFormField(setFormState, 'name', event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Slug" error={fieldErrors.slug}>
                <input
                  value={formState.slug}
                  onChange={(event) => updateFormField(setFormState, 'slug', event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="san-pham-cua-ban"
                />
              </Field>

              <Field label="Danh mục" error={fieldErrors.categoryId}>
                <select
                  value={formState.categoryId}
                  onChange={(event) => updateFormField(setFormState, 'categoryId', event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Chọn danh mục</option>
                  {categoriesQuery.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Giá gốc" error={fieldErrors.basePrice}>
                <input
                  value={formState.basePrice}
                  onChange={(event) => updateFormField(setFormState, 'basePrice', event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Giá giảm" error={fieldErrors.salePrice}>
                <input
                  value={formState.salePrice}
                  onChange={(event) => updateFormField(setFormState, 'salePrice', event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Để trống nếu không giảm"
                />
              </Field>

              <Field label="Trạng thái">
                <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(event) => updateFormField(setFormState, 'isActive', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                  />
                  Đang bật
                </label>
              </Field>

              <div className="md:col-span-2">
                <Field label="Mô tả" error={fieldErrors.description}>
                  <textarea
                    value={formState.description}
                    onChange={(event) => updateFormField(setFormState, 'description', event.target.value)}
                    rows={6}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
              </div>

              {formError ? (
                <div className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="md:col-span-2 flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold"
                  onClick={closeForm}
                  disabled={saveMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({
  label,
  children,
  error
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {active ? 'Đang bật' : 'Đang tắt'}
    </span>
  );
}

function PageButton({
  label,
  disabled,
  onClick
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
      <h2 className="text-lg font-bold text-slate-950">Không có sản phẩm phù hợp</h2>
      <p className="mt-2 text-sm text-slate-600">Thử đổi bộ lọc hoặc tạo sản phẩm mới.</p>
      <button
        type="button"
        className="mt-5 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"
        onClick={onClear}
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function getEmptyFormState(): ProductFormState {
  return {
    name: '',
    slug: '',
    categoryId: '',
    description: '',
    basePrice: '',
    salePrice: '',
    isActive: true
  };
}

function updateFormField<K extends keyof ProductFormState>(
  setter: Dispatch<SetStateAction<ProductFormState>>,
  key: K,
  value: ProductFormState[K]
) {
  setter((current) => ({ ...current, [key]: value }));
}

function validateForm(state: ProductFormState): {
  data: AdminProductUpsertRequest;
  message: string;
  errors?: Partial<Record<keyof ProductFormState, string>>;
} {
  const errors: Partial<Record<keyof ProductFormState, string>> = {};
  const name = state.name.trim();
  const slug = state.slug.trim();
  const description = state.description.trim();
  const categoryId = Number(state.categoryId);
  const basePrice = Number(state.basePrice);
  const salePriceValue = state.salePrice.trim() === '' ? null : Number(state.salePrice);

  if (!name) {
    errors.name = 'Tên sản phẩm không được để trống.';
  }

  if (!slug) {
    errors.slug = 'Slug sản phẩm không được để trống.';
  }

  if (!state.categoryId || !Number.isFinite(categoryId)) {
    errors.categoryId = 'Vui lòng chọn danh mục.';
  }

  if (!description) {
    errors.description = 'Mô tả sản phẩm không được để trống.';
  }

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    errors.basePrice = 'Giá gốc phải lớn hơn 0.';
  }

  if (salePriceValue !== null) {
    if (!Number.isFinite(salePriceValue) || salePriceValue <= 0) {
      errors.salePrice = 'Giá giảm phải lớn hơn 0.';
    } else if (Number.isFinite(basePrice) && salePriceValue >= basePrice) {
      errors.salePrice = 'Giá giảm phải nhỏ hơn giá gốc.';
    }
  }

  const hasError = Object.keys(errors).length > 0;
  return {
    data: {
      name,
      slug,
      categoryId: Number.isFinite(categoryId) ? categoryId : 0,
      description,
      basePrice: Number.isFinite(basePrice) ? basePrice : 0,
      salePrice: salePriceValue,
      isActive: state.isActive
    },
    message: hasError ? 'Vui lòng kiểm tra lại dữ liệu sản phẩm.' : '',
    errors: hasError ? errors : undefined
  };
}

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Không thể lưu sản phẩm.';
}
