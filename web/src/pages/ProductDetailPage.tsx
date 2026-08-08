import { Star } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Link, useNavigate, useParams } from 'react-router';
import { addCartItem } from '../api/cart';
import { getProduct, getRelatedProducts } from '../api/catalog';
import { ProductCard } from '../components/ProductCard';
import { formatCurrency } from '../utils/format';

export function ProductDetailPage() {
  const { idOrSlug = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const productQuery = useQuery({
    queryKey: ['product', idOrSlug],
    queryFn: () => getProduct(idOrSlug),
    enabled: Boolean(idOrSlug)
  });

  const relatedQuery = useQuery({
    queryKey: ['related-products', productQuery.data?.id],
    queryFn: () => getRelatedProducts(productQuery.data!.id),
    enabled: Boolean(productQuery.data?.id)
  });

  const addCartMutation = useMutation({
    mutationFn: ({ productVariantId }: { productVariantId: number; redirectToCheckout: boolean }) =>
      addCartItem(productVariantId, 1),
    onMutate: () => {
      setSuccessMessage('');
      setErrorMessage('');
    },
    onSuccess: (cart, variables) => {
      queryClient.setQueryData(['cart'], cart);
      if (variables.redirectToCheckout) {
        navigate('/checkout');
      } else {
        setSuccessMessage('Đã thêm sản phẩm vào giỏ hàng.');
      }
    },
    onError: (error) => {
      setErrorMessage(getBackendErrorMessage(error));
    }
  });

  if (productQuery.isLoading) {
    return <LoadingState />;
  }

  if (productQuery.isError || !productQuery.data) {
    return <ErrorState />;
  }

  const product = productQuery.data;
  const firstInStockVariant = product.variants.find((variant) => variant.isActive && variant.stockQuantity > 0);
  const selectedVariant =
    selectedVariantId === null
      ? firstInStockVariant ?? null
      : product.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const selectedVariantHasStock = Boolean(
    selectedVariant && selectedVariant.isActive && selectedVariant.stockQuantity > 0
  );
  const canPurchase = selectedVariantHasStock && !addCartMutation.isPending;

  const displayPrice = selectedVariant?.price ?? product.salePrice ?? product.basePrice;
  const selectedVariantLabel = selectedVariant
    ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(' - ') || 'Mặc định'
    : '';

  function handleVariantSelect(variantId: number) {
    setSelectedVariantId(variantId);
    setSuccessMessage('');
    setErrorMessage('');
  }

  function handleAddToCart(redirectToCheckout: boolean) {
    if (!selectedVariant || !selectedVariantHasStock) {
      return;
    }

    addCartMutation.mutate({
      productVariantId: selectedVariant.id,
      redirectToCheckout
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <div className="flex aspect-square items-center justify-center rounded-md bg-emerald-50 text-center text-lg font-semibold text-emerald-800">
            {product.primaryImageUrl ? (
              <img src={product.primaryImageUrl} alt={product.name} className="h-full w-full rounded-md object-cover" />
            ) : (
              product.name
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image) => (
              <div key={image.id} className="aspect-square rounded-md border border-slate-200 bg-white p-1">
                <img src={image.imageUrl} alt={image.altText} className="h-full w-full rounded-sm object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-500">{product.category.name}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />
            <span className="font-semibold">{product.averageRating.toFixed(1)}</span>
            <span className="text-slate-500">({product.reviewCount} đánh giá)</span>
          </div>
          <div className="mt-4 text-3xl font-bold text-emerald-700">{formatCurrency(displayPrice)}</div>
          {product.salePrice ? (
            <div className="text-sm text-slate-400 line-through">{formatCurrency(product.basePrice)}</div>
          ) : null}

          <p className="mt-6 whitespace-pre-line text-slate-700">{product.description}</p>

          <div className="mt-6 rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Biến thể</h2>
              {selectedVariant ? (
                <div className="text-right text-sm text-slate-500">
                  <div>{selectedVariantLabel}</div>
                  <div>
                    SKU: <span className="font-medium text-slate-700">{selectedVariant.sku}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-rose-600">Không còn biến thể nào có hàng.</div>
              )}
            </div>

            <div className="mt-3 grid gap-2">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleVariantSelect(variant.id)}
                  disabled={!variant.isActive || variant.stockQuantity <= 0}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition ${
                    selectedVariant?.id === variant.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <div>
                    <div className="font-medium">{variant.sku}</div>
                    <div className="text-sm text-slate-500">
                      {[variant.color, variant.size].filter(Boolean).join(' - ') || 'Mặc định'}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{formatCurrency(variant.price)}</div>
                    <div className={variant.isActive && variant.stockQuantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {variant.isActive && variant.stockQuantity > 0 ? `Còn ${variant.stockQuantity}` : 'Hết hàng'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Biến thể đang chọn</div>
            {selectedVariant ? (
              <div className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  Giá: <span className="font-semibold text-slate-950">{formatCurrency(displayPrice)}</span>
                </div>
                <div>
                  SKU: <span className="font-semibold text-slate-950">{selectedVariant.sku}</span>
                </div>
                <div>
                  Màu: <span className="font-medium">{selectedVariant.color || 'Mặc định'}</span>
                </div>
                <div>
                  Size: <span className="font-medium">{selectedVariant.size || 'Mặc định'}</span>
                </div>
                <div>
                  Tồn kho:{' '}
                  <span className={selectedVariantHasStock ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                    {selectedVariantHasStock ? selectedVariant.stockQuantity : 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-rose-600">Không có biến thể còn hàng để chọn.</div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={!canPurchase || !selectedVariant}
              onClick={() => handleAddToCart(false)}
              className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Thêm vào giỏ
            </button>
            <button
              type="button"
              disabled={!canPurchase || !selectedVariant}
              onClick={() => handleAddToCart(true)}
              className="rounded-md border border-slate-300 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mua ngay
            </button>
          </div>
          {successMessage ? (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section>
          <h2 className="text-xl font-bold text-slate-950">Danh sách đánh giá</h2>
          <div className="mt-4 space-y-3">
            {product.reviews.length ? (
              product.reviews.map((review) => (
                <article key={review.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Star className="h-4 w-4 fill-amber-500" />
                    <span className="font-semibold">{review.rating}/5</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{review.comment ?? 'Không có nội dung.'}</p>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                Chưa có đánh giá.
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Sản phẩm liên quan</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {relatedQuery.data?.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
          <div className="mt-3 text-sm text-slate-500">
            <Link to="/products" className="text-emerald-700 hover:underline">
              Quay lại danh sách sản phẩm
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}

function getBackendErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data;

    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message;
    }
  }

  return 'Không thêm được sản phẩm vào giỏ hàng.';
}

function LoadingState() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="aspect-square rounded-md bg-slate-100" />
        <div className="space-y-3">
          <div className="h-8 w-2/3 rounded bg-slate-100" />
          <div className="h-6 w-1/4 rounded bg-slate-100" />
          <div className="h-24 rounded bg-slate-100" />
        </div>
      </div>
    </section>
  );
}

function ErrorState() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
        Không tải được chi tiết sản phẩm.
      </div>
    </section>
  );
}
