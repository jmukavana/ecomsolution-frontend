export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export interface ProductImage {
  url: string;
  alt?: string | null;
  position?: number;
}

export interface ProductSummary {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  category_id: number | null;
  base_price_kes: string | null;
  is_active: boolean;
  is_featured: boolean;
  images: ProductImage[];
}

export interface ProductVariant {
  id: number;
  sku: string;
  option_values: Record<string, JsonValue>;
  price_kes: string;
  stock: number;
  weight_kg: string | null;
  image_url: string | null;
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  attributes: Record<string, JsonValue>;
  weight_kg: string | null;
  variants: ProductVariant[];
}

export interface FilterableAttribute {
  key: string;
  label: string;
  data_type: "text" | "number" | "boolean" | "enum" | "date";
  unit: string | null;
  options: string[];
}

export interface ProductListResponse {
  items: ProductSummary[];
  total: number;
  page: number;
  page_size: number;
  filters: {
    brands: string[];
    attributes: FilterableAttribute[];
  };
}

export interface CategoryNode {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  position: number;
  image: string | null;
  attribute_set_id: number | null;
  children: CategoryNode[];
}
