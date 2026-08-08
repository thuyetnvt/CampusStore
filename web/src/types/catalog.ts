import type { PagedResult } from './paging';

export interface Category {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: number | null;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  categoryName: string;
  basePrice: number;
  salePrice: number | null;
  primaryImageUrl: string | null;
  totalStock: number;
  averageRating: number;
  reviewCount: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  color: string | null;
  size: string | null;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: Category;
  basePrice: number;
  salePrice: number | null;
  primaryImageUrl: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews: ProductReview[];
  averageRating: number;
  reviewCount: number;
}

export interface ProductQueryParams {
  keyword?: string;
  categoryId?: number;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export type ProductPage = PagedResult<ProductListItem>;
