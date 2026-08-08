import { Star } from 'lucide-react';
import { Link } from 'react-router';
import type { ProductListItem } from '../types/catalog';
import { formatCurrency } from '../utils/format';

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const price = product.salePrice ?? product.basePrice;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex min-h-[260px] flex-col rounded-md border border-slate-200 bg-white p-3 transition hover:border-emerald-500 hover:shadow-sm"
    >
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-emerald-50 text-center text-sm font-semibold text-emerald-800">
        {product.primaryImageUrl ? (
          <img src={product.primaryImageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          product.name
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-xs text-slate-500">{product.categoryName}</p>
        <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950 group-hover:text-emerald-700">
          {product.name}
        </h2>
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
          <Star className="h-3.5 w-3.5 fill-amber-500" aria-hidden="true" />
          <span>{product.averageRating.toFixed(1)}</span>
          <span className="text-slate-400">({product.reviewCount})</span>
        </div>
        <div className="mt-auto pt-3">
          <div className="font-bold text-emerald-700">{formatCurrency(price)}</div>
          {product.salePrice ? (
            <div className="text-xs text-slate-400 line-through">{formatCurrency(product.basePrice)}</div>
          ) : null}
          <div className="mt-1 text-xs text-slate-500">
            {product.totalStock > 0 ? `Còn ${product.totalStock} sản phẩm` : 'Hết hàng'}
          </div>
        </div>
      </div>
    </Link>
  );
}
