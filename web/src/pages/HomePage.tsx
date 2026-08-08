import { ArrowRight, GraduationCap } from 'lucide-react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getCategories, getProducts } from '../api/catalog';
import { ProductCard } from '../components/ProductCard';
import type { ProductPage } from '../types/catalog';

export function HomePage() {
  const categoriesQuery = useQuery({
    queryKey: ['home-categories'],
    queryFn: getCategories
  });

  const newProductsQuery = useQuery({
    queryKey: ['home-products', 'newest'],
    queryFn: () => getProducts({ page: 1, pageSize: 8, sort: 'newest' })
  });

  const bestSellerQuery = useQuery({
    queryKey: ['home-products', 'best_selling'],
    queryFn: () => getProducts({ page: 1, pageSize: 8, sort: 'best_selling' })
  });

  const saleQuery = useQuery({
    queryKey: ['home-products', 'sale'],
    queryFn: () =>
      getProducts({ page: 1, pageSize: 8, saleOnly: true } as Parameters<typeof getProducts>[0] & {
        saleOnly: boolean;
      })
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-[360px] flex-col justify-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Shop học tập cho sinh viên
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
            CampusStore
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">
            Mua văn phòng phẩm, học liệu và phụ kiện học tập với quy trình đơn giản,
            giá minh bạch và đơn hàng theo dõi được.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
            >
              Xem sản phẩm <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="flex min-h-[320px] items-center justify-center rounded-md bg-[#e9f5f0] p-8">
          <GraduationCap className="h-32 w-32 text-emerald-700" aria-hidden="true" />
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950">Danh mục nổi bật</h2>
        </div>
        {categoriesQuery.isLoading ? (
          <div className="text-sm text-slate-500">Đang tải danh mục...</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoriesQuery.data?.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                to={`/products?categorySlug=${encodeURIComponent(category.slug)}`}
                className="rounded-md border border-slate-200 bg-white px-4 py-5 font-medium hover:border-emerald-500"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <ProductSection title="Sản phẩm mới" query={newProductsQuery} />
      <ProductSection title="Bán chạy" query={bestSellerQuery} />
      <ProductSection title="Đang giảm giá" query={saleQuery} emptyMessage="Hiện chưa có sản phẩm nào đang giảm giá." />
    </div>
  );
}

function ProductSection({
  title,
  query,
  emptyMessage = 'Chưa có sản phẩm trong mục này.'
}: {
  title: string;
  query: {
    isLoading: boolean;
    isError: boolean;
    data?: ProductPage;
  };
  emptyMessage?: string;
}) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      </div>
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[260px] rounded-md bg-slate-100" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Không tải được sản phẩm.
        </div>
      ) : query.data?.items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {query.data.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
