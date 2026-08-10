import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilLine, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  createAdminCategory,
  getAdminCategories,
  setAdminCategoryActive,
  updateAdminCategory,
  type AdminCategoryListItem,
  type AdminCategoryUpsertRequest
} from '../../api/adminCategories';

const DEFAULT_PAGE_SIZE = 12;

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  isActive: boolean;
};

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryListItem | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>(getEmptyFormState());
  const [formError, setFormError] = useState('');

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories', page, keyword, activeFilter],
    queryFn: () =>
      getAdminCategories({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        keyword: keyword || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active'
      }),
    retry: false
  });

  const allCategoriesQuery = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: () => getAdminCategories({ page: 1, pageSize: 100 }),
    retry: false
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: number | null; data: AdminCategoryUpsertRequest }) =>
      payload.id === null
        ? createAdminCategory(payload.data)
        : updateAdminCategory(payload.id, payload.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] });
      closeForm();
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setAdminCategoryActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
  });

  function openCreateForm() {
    setEditingCategory(null);
    setFormState(getEmptyFormState());
    setFormError('');
    setIsFormOpen(true);
  }

  function openEditForm(category: AdminCategoryListItem) {
    setEditingCategory(category);
    setFormState({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      parentId: category.parentId === null ? '' : String(category.parentId),
      isActive: category.isActive
    });
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCategory(null);
    setFormState(getEmptyFormState());
    setFormError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = normalizeForm(formState);
    if ('message' in payload) {
      setFormError(payload.message);
      return;
    }

    setFormError('');
    await saveMutation.mutateAsync({
      id: editingCategory?.id ?? null,
      data: payload.data
    });
  }

  const items = categoriesQuery.data?.items ?? [];

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin / Staff</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Quản lý danh mục</h1>
          <p className="mt-2 text-sm text-slate-600">Tạo, sửa, bật/tắt danh mục và theo dõi số sản phẩm trong từng danh mục.</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm danh mục
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-bold text-slate-950">Bộ lọc</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tìm kiếm</span>
              <input
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Tên, slug, mô tả"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Trạng thái</span>
              <select
                value={activeFilter}
                onChange={(event) => {
                  setActiveFilter(event.target.value as typeof activeFilter);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang bật</option>
                <option value="inactive">Đang tắt</option>
              </select>
            </label>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {categoriesQuery.isLoading ? 'Đang tải danh mục...' : `${categoriesQuery.data?.totalItems ?? 0} danh mục`}
          </div>

          {categoriesQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
          ) : categoriesQuery.isError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Không tải được danh sách danh mục.
            </div>
          ) : items.length ? (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Danh mục</th>
                      <th className="px-4 py-3">Mô tả</th>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((category) => (
                      <tr key={category.id}>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-950">{category.name}</div>
                          <div className="text-slate-500">{category.slug}</div>
                          {category.parentId ? <div className="text-xs text-slate-400">Parent ID: {category.parentId}</div> : null}
                        </td>
                        <td className="px-4 py-4 text-slate-600">{category.description ?? '—'}</td>
                        <td className="px-4 py-4 font-semibold text-slate-950">{category.productCount}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${category.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {category.isActive ? 'Đang bật' : 'Đang tắt'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                              onClick={() => openEditForm(category)}
                            >
                              <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                              Sửa
                            </button>
                            <button
                              type="button"
                              className={`rounded-md px-3 py-2 text-xs font-semibold text-white ${
                                category.isActive ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'
                              }`}
                              onClick={() => toggleActiveMutation.mutate({ id: category.id, isActive: !category.isActive })}
                              disabled={toggleActiveMutation.isPending}
                            >
                              {category.isActive ? 'Tắt' : 'Bật'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-2">
                <PagerButton label="Trước" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} />
                <span className="text-sm text-slate-600">
                  Trang {categoriesQuery.data?.page ?? page} / {categoriesQuery.data?.totalPages ?? 1}
                </span>
                <PagerButton
                  label="Sau"
                  disabled={page >= (categoriesQuery.data?.totalPages ?? 1)}
                  onClick={() => setPage((value) => value + 1)}
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
              <h2 className="text-lg font-bold text-slate-950">Không có danh mục phù hợp</h2>
              <p className="mt-2 text-sm text-slate-600">Thử thay đổi bộ lọc hoặc tạo danh mục mới.</p>
            </div>
          )}
        </div>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6" onMouseDown={closeForm}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-950">{editingCategory ? 'Sửa danh mục' : 'Tạo danh mục'}</h2>
            </div>
            <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <Field label="Tên danh mục">
                <input value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
              <Field label="Slug">
                <input value={formState.slug} onChange={(event) => setFormState((current) => ({ ...current, slug: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
              <Field label="Danh mục cha">
                <select value={formState.parentId} onChange={(event) => setFormState((current) => ({ ...current, parentId: event.target.value }))} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                  <option value="">Không có</option>
                  {allCategoriesQuery.data?.items
                    .filter((category) => category.id !== editingCategory?.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Trạng thái">
                <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={formState.isActive} onChange={(event) => setFormState((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-emerald-700" />
                  Đang bật
                </label>
              </Field>
              <div className="md:col-span-2">
                <Field label="Mô tả">
                  <textarea value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} rows={5} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
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

function getEmptyFormState(): CategoryFormState {
  return {
    name: '',
    slug: '',
    description: '',
    parentId: '',
    isActive: true
  };
}

function normalizeForm(state: CategoryFormState): { data: AdminCategoryUpsertRequest } | { message: string } {
  const name = state.name.trim();
  const slug = state.slug.trim();
  const description = state.description.trim();

  if (!name) {
    return { message: 'Tên danh mục không được để trống.' };
  }

  if (!slug) {
    return { message: 'Slug danh mục không được để trống.' };
  }

  return {
    data: {
      name,
      slug,
      description: description || null,
      parentId: state.parentId ? Number(state.parentId) : null,
      isActive: state.isActive
    }
  };
}
