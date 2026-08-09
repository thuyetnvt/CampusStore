import type { ReactNode } from 'react';
import { ArrowRight, BookOpenCheck, Headphones, RotateCcw, Truck } from 'lucide-react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getCategories, getProducts } from '../api/catalog';
import { ProductCard } from '../components/ProductCard';
import type { ProductPage } from '../types/catalog';

const heroImages = [
  {
    src: '/images/products/but-gel-campus-0-5-xanh.jpg',
    alt: 'Bút gel học tập'
  },
  {
    src: '/images/products/so-tay-planner-tuan.jpg',
    alt: 'Sổ tay planner tuần'
  },
  {
    src: '/images/products/balo-laptop-campus-15-inch.jpg',
    alt: 'Balo laptop đi học'
  },
  {
    src: '/images/products/den-ban-led-3-che-do.jpg',
    alt: 'Đèn bàn học tập'
  }
];

export function HomePage() {
  const categoriesQuery = useQuery({
    queryKey: ['home-categories'],
    queryFn: getCategories
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

  const newProductsQuery = useQuery({
    queryKey: ['home-products', 'newest'],
    queryFn: () => getProducts({ page: 1, pageSize: 8, sort: 'newest' })
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <section className="overflow-hidden rounded-lg border border-emerald-100 bg-white">
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div className="flex min-h-[360px] flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Đồ dùng học tập cho sinh viên
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
              Chuẩn bị góc học tập gọn gàng, đủ món, dễ mua
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
              CampusStore tập trung vào văn phòng phẩm, học liệu, balo, đèn bàn và phụ kiện học tập thiết yếu cho sinh viên.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800"
              >
                Mua sắm ngay <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                to="/products?sort=best_selling"
                className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2.5 font-semibold text-slate-800 hover:border-emerald-500 hover:text-emerald-700"
              >
                Xem bán chạy
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              <div className="rounded-md bg-emerald-50 px-3 py-3 font-medium">Giá minh bạch</div>
              <div className="rounded-md bg-slate-50 px-3 py-3 font-medium">Dễ theo dõi đơn</div>
              <div className="rounded-md bg-amber-50 px-3 py-3 font-medium">Phù hợp sinh viên</div>
            </div>
          </div>

          <div className="grid min-h-[360px] grid-cols-2 gap-3">
            {heroImages.map((image, index) => (
              <div
                key={image.src}
                className={`overflow-hidden rounded-lg bg-slate-100 ${index === 1 ? 'mt-8' : ''} ${index === 2 ? '-mt-8' : ''}`}
              >
                <img src={image.src} alt={image.alt} className="h-full min-h-[160px] w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader title="Danh mục nổi bật" actionTo="/products" />
        {categoriesQuery.isLoading ? (
          <CategorySkeleton />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoriesQuery.data?.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                to={`/products?categorySlug=${encodeURIComponent(category.slug)}`}
                className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                  <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-4 font-semibold text-slate-950 group-hover:text-emerald-700">{category.name}</div>
                <div className="mt-1 text-sm text-slate-500">Xem sản phẩm</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <ProductSection
        title="Sản phẩm bán chạy"
        actionTo="/products?sort=best_selling"
        query={bestSellerQuery}
      />
      <ProductSection
        title="Đang giảm giá"
        actionTo="/products"
        query={saleQuery}
        emptyMessage="Hiện chưa có sản phẩm nào đang giảm giá."
      />
      <ProductSection
        title="Sản phẩm mới"
        actionTo="/products?sort=newest"
        query={newProductsQuery}
      />

      <section className="mt-14">
        <SectionHeader title="Lợi ích khi mua tại CampusStore" actionTo="/products" />
        <div className="grid gap-4 md:grid-cols-3">
          <BenefitCard
            icon={<Truck className="h-5 w-5" aria-hidden="true" />}
            title="Giao hàng gọn nhẹ"
            description="Đóng gói phù hợp đồ dùng học tập, dễ nhận tại nhà hoặc ký túc xá."
          />
          <BenefitCard
            icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
            title="Đổi trả rõ ràng"
            description="Hỗ trợ xử lý khi sản phẩm lỗi, giao nhầm hoặc không đúng mô tả."
          />
          <BenefitCard
            icon={<Headphones className="h-5 w-5" aria-hidden="true" />}
            title="Hỗ trợ sinh viên"
            description="Tập trung vào sản phẩm thiết yếu, giá dễ tiếp cận và quy trình mua đơn giản."
          />
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, actionTo }: { title: string; actionTo: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <Link to={actionTo} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
        Xem tất cả <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function ProductSection({
  title,
  actionTo,
  query,
  emptyMessage = 'Chưa có sản phẩm trong mục này.'
}: {
  title: string;
  actionTo: string;
  query: {
    isLoading: boolean;
    isError: boolean;
    data?: ProductPage;
  };
  emptyMessage?: string;
}) {
  return (
    <section className="mt-14">
      <SectionHeader title={title} actionTo={actionTo} />
      {query.isLoading ? (
        <ProductSkeleton />
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

function BenefitCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">{icon}</div>
      <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-32 rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-[380px] rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}
