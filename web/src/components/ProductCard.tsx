import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Check, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router';
import { getMe } from '../api/auth';
import { addCartItem } from '../api/cart';
import { getProduct } from '../api/catalog';
import type { ProductListItem } from '../types/catalog';
import { formatCurrency } from '../utils/format';

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000
  });
  const hasSale = Boolean(product.salePrice && product.salePrice < product.basePrice);
  const discountPercent = hasSale ? Math.round((1 - product.salePrice! / product.basePrice) * 100) : 0;
  const hasStock = product.totalStock > 0;
  const canPurchase = !user || user.roles.includes('Customer');

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const detail = await getProduct(product.slug);
      const variant = detail.variants.find((item) => item.isActive && item.stockQuantity > 0);

      if (!variant) {
        throw new Error('Sản phẩm này hiện đã hết hàng.');
      }

      return addCartItem(variant.id, 1);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(['cart'], cart);
    }
  });

  const displayPrice = product.salePrice ?? product.basePrice;

  return (
    <article className="group flex h-full min-h-[390px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md">
      <Link to={`/products/${product.slug}`} className="relative block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {product.primaryImageUrl ? (
            <img
              src={product.primaryImageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 px-4 text-center text-sm font-semibold text-emerald-800">
              {product.categoryName}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/25 to-transparent opacity-0 transition group-hover:opacity-100" />
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {hasSale ? (
            <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Giảm {discountPercent}%
            </span>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
              hasStock ? 'bg-white/95 text-emerald-700' : 'bg-white/95 text-rose-700'
            }`}
          >
            {hasStock ? 'Còn hàng' : 'Hết hàng'}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.categoryName}</p>
        <Link to={`/products/${product.slug}`} className="mt-1 block">
          <h2 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950 transition group-hover:text-emerald-700">
            {product.name}
          </h2>
        </Link>

        {product.reviewCount > 0 ? (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
            <span className="font-semibold text-slate-700">{product.averageRating.toFixed(1)}</span>
            <span className="text-slate-400">({product.reviewCount})</span>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-400">Chưa có đánh giá</div>
        )}

        <div className="mt-3 space-y-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <div className="text-base font-bold text-emerald-700">{formatCurrency(displayPrice)}</div>
            {hasSale ? <div className="text-xs text-slate-400 line-through">{formatCurrency(product.basePrice)}</div> : null}
          </div>
          <div className={`text-xs font-medium ${hasStock ? 'text-emerald-700' : 'text-rose-600'}`}>
            {hasStock ? `Còn ${product.totalStock} sản phẩm` : 'Hết hàng'}
          </div>
        </div>

        <div className="mt-auto pt-4">
          {!canPurchase ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-500">
              Chỉ dành cho khách hàng
            </div>
          ) : hasStock ? (
            <button
              type="button"
              onClick={() => addToCartMutation.mutate()}
              disabled={addToCartMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addToCartMutation.isPending ? (
                <>
                  <ShoppingCart className="h-4 w-4 animate-pulse" aria-hidden="true" />
                  Đang thêm...
                </>
              ) : addToCartMutation.isSuccess ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Đã thêm vào giỏ
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Thêm vào giỏ
                </>
              )}
            </button>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-500">
              Hết hàng
            </div>
          )}

          {addToCartMutation.isError ? (
            <p className="mt-2 text-xs text-rose-700">{getBackendErrorMessage(addToCartMutation.error)}</p>
          ) : null}
        </div>
      </div>
    </article>
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

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Không thêm được sản phẩm vào giỏ hàng.';
}
