import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { getCategories, getProducts } from '../api/catalog';
import { ProductCard } from '../components/ProductCard';

const DEBOUNCE_MS = 400;
const DEFAULT_PAGE_SIZE = 12;

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const page = toPositiveNumber(searchParams.get('page'), 1);
  const pageSize = toPositiveNumber(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);
  const keyword = searchParams.get('keyword') ?? '';
  const categorySlug = searchParams.get('categorySlug') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const inStock = searchParams.get('inStock') === 'true';
  const sort = searchParams.get('sort') ?? 'newest';
  const [keywordDraftState, setKeywordDraftState] = useState({ value: keyword, source: keyword });
  const keywordDraft = keywordDraftState.source === keyword ? keywordDraftState.value : keyword;
  const setKeywordDraft = useCallback(
    (value: string) => setKeywordDraftState({ value, source: keyword }),
    [keyword]
  );

  const updateParams = useCallback(
    (
      next: Record<string, string | number | boolean | undefined>,
      resetPage = true,
      replace = false
    ) => {
      const params = new URLSearchParams(searchParams);

      Object.entries(next).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === false) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      if (resetPage) {
        params.set('page', '1');
      }

      if (!params.get('pageSize')) {
        params.set('pageSize', String(pageSize));
      }

      setSearchParams(params, { replace });
    },
    [pageSize, searchParams, setSearchParams]
  );

  const updateFilter = useCallback(
    (next: Record<string, string | number | boolean | undefined>) =>
      updateParams({ keyword: keywordDraft.trim(), ...next }),
    [keywordDraft, updateParams]
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('pageSize', String(pageSize));
    setKeywordDraftState({ value: '', source: keyword });
    setSearchParams(params);
  }, [keyword, pageSize, setSearchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (keywordDraft.trim() !== keyword) {
        updateParams({ keyword: keywordDraft.trim() }, true, true);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [keywordDraft, keyword, updateParams]);

  useEffect(() => {
    if (!isFilterOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFilterOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFilterOpen]);

  const productParams = useMemo(
    () => ({
      keyword: keyword || undefined,
      categorySlug: categorySlug || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStock || undefined,
      sort,
      page,
      pageSize
    }),
    [categorySlug, inStock, keyword, maxPrice, minPrice, page, pageSize, sort]
  );

  const productsQuery = useQuery({
    queryKey: ['products', productParams],
    queryFn: () => getProducts(productParams)
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const activeCategoryName = useMemo(
    () => categoriesQuery.data?.find((category) => category.slug === categorySlug)?.name ?? '',
    [categoriesQuery.data, categorySlug]
  );

  const hasActiveFilters = Boolean(
    keyword || categorySlug || minPrice || maxPrice || inStock || (sort && sort !== 'newest')
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">CampusStore</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">Danh sách sản phẩm</h1>
        {activeCategoryName ? (
          <p className="mt-2 text-sm text-slate-500">Đang lọc theo {activeCategoryName}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Tìm đồ dùng học tập, văn phòng phẩm và phụ kiện phù hợp.</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border border-slate-200 bg-white p-4">
            <FilterPanel
              keywordDraft={keywordDraft}
              setKeywordDraft={setKeywordDraft}
              categorySlug={categorySlug}
              minPrice={minPrice}
              maxPrice={maxPrice}
              inStock={inStock}
              sort={sort}
              categories={categoriesQuery.data ?? []}
              categoriesLoading={categoriesQuery.isLoading}
              hasActiveFilters={hasActiveFilters}
              updateFilter={updateFilter}
              clearFilters={clearFilters}
            />
          </div>
        </aside>

        <div>
          <div className="mb-4 flex gap-2 lg:hidden">
            <SearchInput value={keywordDraft} onChange={setKeywordDraft} />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
              onClick={() => setIsFilterOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Lọc
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-sm text-slate-600">
              {productsQuery.isLoading ? 'Đang tải sản phẩm...' : `${productsQuery.data?.totalItems ?? 0} sản phẩm`}
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                className="text-sm font-semibold text-emerald-700 hover:underline"
                onClick={clearFilters}
              >
                Xóa toàn bộ bộ lọc
              </button>
            ) : null}
          </div>

          {productsQuery.isLoading ? (
            <ProductSkeleton />
          ) : productsQuery.isError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Không tải được danh sách sản phẩm.
            </div>
          ) : productsQuery.data?.items.length ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {productsQuery.data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-8 flex items-center justify-center gap-2">
                <PaginationButton
                  label="Trước"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: page - 1 }, false)}
                />
                <span className="text-sm text-slate-600">
                  Trang {productsQuery.data.page} / {productsQuery.data.totalPages}
                </span>
                <PaginationButton
                  label="Sau"
                  disabled={page >= productsQuery.data.totalPages}
                  onClick={() => updateParams({ page: page + 1 }, false)}
                />
              </div>
            </>
          ) : (
            <EmptyState hasActiveFilters={hasActiveFilters} onClear={clearFilters} />
          )}
        </div>
      </div>

      {isFilterOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" onMouseDown={() => setIsFilterOpen(false)}>
          <div
            className="ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="font-semibold text-slate-950">Bộ lọc sản phẩm</div>
              <button
                type="button"
                className="rounded-md border border-slate-200 p-2 text-slate-600"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Đóng bộ lọc"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterPanel
                keywordDraft={keywordDraft}
                setKeywordDraft={setKeywordDraft}
                categorySlug={categorySlug}
                minPrice={minPrice}
                maxPrice={maxPrice}
                inStock={inStock}
                sort={sort}
                categories={categoriesQuery.data ?? []}
                categoriesLoading={categoriesQuery.isLoading}
                hasActiveFilters={hasActiveFilters}
                updateFilter={updateFilter}
                clearFilters={clearFilters}
              />
            </div>
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                className="w-full rounded-md bg-emerald-700 px-4 py-2.5 font-semibold text-white"
                onClick={() => setIsFilterOpen(false)}
              >
                Xem kết quả
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FilterPanel({
  keywordDraft,
  setKeywordDraft,
  categorySlug,
  minPrice,
  maxPrice,
  inStock,
  sort,
  categories,
  categoriesLoading,
  hasActiveFilters,
  updateFilter,
  clearFilters
}: {
  keywordDraft: string;
  setKeywordDraft: (value: string) => void;
  categorySlug: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sort: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  categoriesLoading: boolean;
  hasActiveFilters: boolean;
  updateFilter: (next: Record<string, string | number | boolean | undefined>) => void;
  clearFilters: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-950">Bộ lọc</h2>
        {hasActiveFilters ? (
          <button type="button" className="text-sm font-semibold text-emerald-700 hover:underline" onClick={clearFilters}>
            Xóa hết
          </button>
        ) : null}
      </div>

      <Field label="Tìm kiếm">
        <SearchInput value={keywordDraft} onChange={setKeywordDraft} />
      </Field>

      <Field label="Danh mục">
        <select
          value={categorySlug}
          onChange={(event) => updateFilter({ categorySlug: event.target.value })}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          disabled={categoriesLoading}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Khoảng giá">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={minPrice}
            onChange={(event) => updateFilter({ minPrice: event.target.value })}
            type="number"
            min="0"
            inputMode="numeric"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Từ"
          />
          <input
            value={maxPrice}
            onChange={(event) => updateFilter({ maxPrice: event.target.value })}
            type="number"
            min="0"
            inputMode="numeric"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Đến"
          />
        </div>
      </Field>

      <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(event) => updateFilter({ inStock: event.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-emerald-700"
        />
        Chỉ sản phẩm còn hàng
      </label>

      <Field label="Sắp xếp">
        <select
          value={sort}
          onChange={(event) => updateFilter({ sort: event.target.value })}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="best_selling">Bán chạy</option>
        </select>
      </Field>
    </div>
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

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      placeholder="Tìm sản phẩm"
    />
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="h-[380px] animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function EmptyState({ hasActiveFilters, onClear }: { hasActiveFilters: boolean; onClear: () => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
      <h2 className="text-lg font-bold text-slate-950">Không tìm thấy sản phẩm phù hợp</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Thử đổi từ khóa, danh mục hoặc khoảng giá để xem thêm sản phẩm khác trong CampusStore.
      </p>
      {hasActiveFilters ? (
        <button
          type="button"
          className="mt-5 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"
          onClick={onClear}
        >
          Xóa toàn bộ bộ lọc
        </button>
      ) : null}
    </div>
  );
}

function PaginationButton({
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
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function toPositiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
