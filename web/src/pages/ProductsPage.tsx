import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { getCategories, getProducts } from '../api/catalog';
import { ProductCard } from '../components/ProductCard';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '12');
  const keyword = searchParams.get('keyword') ?? '';
  const categorySlug = searchParams.get('categorySlug') ?? '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sort = searchParams.get('sort') ?? 'newest';

  const productsQuery = useQuery({
    queryKey: ['products', Object.fromEntries(searchParams.entries())],
    queryFn: () =>
      getProducts({
        keyword: keyword || undefined,
        categorySlug: categorySlug || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort,
        page,
        pageSize
      })
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const activeCategoryName = useMemo(
    () => categoriesQuery.data?.find((category) => category.slug === categorySlug)?.name ?? '',
    [categoriesQuery.data, categorySlug]
  );

  function updateParams(next: Record<string, string | number | undefined>, resetPage = true) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    if (resetPage) {
      params.set('page', '1');
    }
    setSearchParams(params);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-sm font-medium">Tìm kiếm</label>
          <input
            value={keyword}
            onChange={(event) => updateParams({ keyword: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Tìm sản phẩm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Danh mục</label>
          <select
            value={categorySlug}
            onChange={(event) => updateParams({ categorySlug: event.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Tất cả</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Sắp xếp</label>
          <select
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="best_selling">Bán chạy</option>
          </select>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-950">Danh sách sản phẩm</h1>
      {activeCategoryName ? (
        <p className="mt-2 text-sm text-slate-500">Đang lọc theo {activeCategoryName}</p>
      ) : null}

      {productsQuery.isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-[260px] rounded-md bg-slate-100" />
          ))}
        </div>
      ) : productsQuery.isError ? (
        <div className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Không tải được danh sách sản phẩm.
        </div>
      ) : productsQuery.data?.items.length ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="mt-6 rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
          Không tìm thấy sản phẩm phù hợp.
        </div>
      )}
    </section>
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
      className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
