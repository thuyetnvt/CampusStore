import { http } from './http';
import type { Category, ProductDetail, ProductPage, ProductQueryParams } from '../types/catalog';

export async function getCategories() {
  const response = await http.get<Category[]>('/categories');
  return response.data;
}

export async function getProducts(params: ProductQueryParams) {
  const response = await http.get<ProductPage>('/products', { params });
  return response.data;
}

export async function getProduct(idOrSlug: string) {
  const response = await http.get<ProductDetail>(`/products/${idOrSlug}`);
  return response.data;
}

export async function getRelatedProducts(id: number) {
  const response = await http.get<ProductPage['items']>(`/products/${id}/related`);
  return response.data;
}
