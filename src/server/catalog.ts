import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type {
  CategoryNode,
  ProductDetail,
  ProductListResponse,
} from "@/lib/catalog-types";

const API_BASE =
  process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function get<T>(path: string, search?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (search) {
    for (const [k, v] of Object.entries(search)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    const msg =
      typeof detail === "object" && detail && "detail" in detail
        ? String((detail as { detail: unknown }).detail)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

// -- search params used by the listing page --
export const productListSearchSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  q: z.string().optional(),
  min_price: z.string().optional(),
  max_price: z.string().optional(),
  featured: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
});

export type ProductListSearch = z.infer<typeof productListSearchSchema>;

// -- server functions --

export const fetchCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryNode[]> => {
    return get<CategoryNode[]>("/catalog/categories");
  },
);

export const fetchProducts = createServerFn({ method: "GET" })
  .inputValidator((data: ProductListSearch) => productListSearchSchema.parse(data))
  .handler(async ({ data }): Promise<ProductListResponse> => {
    return get<ProductListResponse>("/catalog/products", {
      category: data.category,
      brand: data.brand,
      q: data.q,
      min_price: data.min_price,
      max_price: data.max_price,
      featured: data.featured == null ? undefined : String(data.featured),
      page: data.page == null ? undefined : String(data.page),
      page_size: data.page_size == null ? undefined : String(data.page_size),
    });
  });

export const fetchProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<ProductDetail> => {
    return get<ProductDetail>(`/catalog/products/${encodeURIComponent(data.slug)}`);
  });

// Query option builders co-located with the server fns so loaders/components
// can share the same key + fn. `queryOptions` preserves the return type so
// `useSuspenseQuery(catalogQueries.product(slug))` is typed end-to-end.
export const catalogQueries = {
  categories: () =>
    queryOptions({
      queryKey: ["catalog", "categories"] as const,
      queryFn: () => fetchCategories() as Promise<CategoryNode[]>,
    }),
  products: (search: ProductListSearch) =>
    queryOptions({
      queryKey: ["catalog", "products", search] as const,
      queryFn: () => fetchProducts({ data: search }) as Promise<ProductListResponse>,
    }),
  product: (slug: string) =>
    queryOptions({
      queryKey: ["catalog", "product", slug] as const,
      queryFn: () => fetchProduct({ data: { slug } }) as Promise<ProductDetail>,
    }),
};
