export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  totalQuantity: number;
}

export interface CartItem {
  id: number;
  productId: number;
  productVariantId: number;
  productName: string;
  productSlug: string;
  sku: string;
  color: string | null;
  size: string | null;
  unitPrice: number;
  quantity: number;
  stockQuantity: number;
  primaryImageUrl: string | null;
  lineTotal: number;
}
