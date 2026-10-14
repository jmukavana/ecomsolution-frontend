import type { OrderDetail, OrderStatus, PaymentMethod } from "@/lib/cart-types";

export interface AdminOrderRow {
  id: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total: string;
  customer_email: string;
  customer_name: string | null;
  created_at: string;
}

export interface AdminOrderListResponse {
  items: AdminOrderRow[];
  total: number;
  page: number;
  page_size: number;
}

export interface LowStockRow {
  variant_id: number;
  sku: string;
  product_id: number;
  product_slug: string;
  product_name: string;
  stock: number;
}

export interface DashboardStats {
  orders_today: number;
  orders_pending: number;
  orders_paid_unshipped: number;
  revenue_this_month: string;
  orders_by_status: Record<string, number>;
  low_stock: LowStockRow[];
  payments_failed_recent: number;
}

export interface AdminProductRow {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  is_active: boolean;
  is_featured: boolean;
  base_price_kes: string | null;
  category_id: number | null;
}

// ---------- Catalog editors ----------

export type AttributeDataType =
  | "text"
  | "number"
  | "boolean"
  | "enum"
  | "date";

export interface AttributeDefinition {
  id?: number;
  key: string;
  label: string;
  data_type: AttributeDataType;
  unit: string | null;
  options: string[] | null;
  is_required: boolean;
  is_filterable: boolean;
  position: number;
}

export interface AttributeSet {
  id: number;
  name: string;
  attributes: AttributeDefinition[];
}

export interface AttributeSetInput {
  name: string;
  attributes: AttributeDefinition[];
}

export interface AdminCategory {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  position: number;
  image: string | null;
  attribute_set_id: number | null;
}

export interface CategoryInput {
  slug: string;
  name: string;
  parent_id?: number | null;
  position?: number;
  image?: string | null;
  attribute_set_id?: number | null;
}

export type { OrderDetail };
