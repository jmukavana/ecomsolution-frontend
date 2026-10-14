import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

import type {
  AdminCategory,
  AdminOrderListResponse,
  AdminProductRow,
  AttributeSet,
  DashboardStats,
  OrderDetail,
} from "@/lib/admin-types";

const API_BASE =
  process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function proxy<T>(path: string, search?: URLSearchParams): Promise<T | null> {
  const cookie = getRequestHeader("cookie") ?? "";
  const url = new URL(`${API_BASE}${path}`);
  if (search) search.forEach((v, k) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    headers: { cookie, accept: "application/json" },
  });
  const sc = res.headers.get("set-cookie");
  if (sc) setResponseHeader("set-cookie", sc);
  if (res.status === 401 || res.status === 403 || res.status === 404) return null;
  if (!res.ok) throw new Error(`backend ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export const fetchAdminStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardStats | null> => proxy<DashboardStats>("/admin/stats"),
);

export const fetchAdminOrders = createServerFn({ method: "GET" })
  .inputValidator((data: { status?: string; page?: number }) => ({
    status: data.status,
    page: data.page ?? 1,
  }))
  .handler(async ({ data }): Promise<AdminOrderListResponse | null> => {
    const sp = new URLSearchParams();
    if (data.status) sp.set("status", data.status);
    sp.set("page", String(data.page));
    return proxy<AdminOrderListResponse>("/admin/orders", sp);
  });

export const fetchAdminOrder = createServerFn({ method: "GET" })
  .inputValidator((data: { id: number }) => ({ id: Number(data.id) }))
  .handler(async ({ data }): Promise<OrderDetail | null> =>
    proxy<OrderDetail>(`/admin/orders/${data.id}`),
  );

export const fetchAdminProducts = createServerFn({ method: "GET" })
  .inputValidator((data: { q?: string }) => ({ q: data.q ?? "" }))
  .handler(async ({ data }): Promise<AdminProductRow[] | null> => {
    const sp = new URLSearchParams();
    if (data.q) sp.set("q", data.q);
    return proxy<AdminProductRow[]>("/admin/catalog/products", sp);
  });

export const fetchAdminCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminCategory[] | null> =>
    proxy<AdminCategory[]>("/admin/catalog/categories"),
);

export const fetchAdminAttributeSets = createServerFn({ method: "GET" }).handler(
  async (): Promise<AttributeSet[] | null> =>
    proxy<AttributeSet[]>("/admin/catalog/attribute-sets"),
);

export const adminQueries = {
  stats: () =>
    queryOptions({
      queryKey: ["admin", "stats"] as const,
      queryFn: () => fetchAdminStats() as Promise<DashboardStats | null>,
      staleTime: 15_000,
    }),
  categories: () =>
    queryOptions({
      queryKey: ["admin", "categories"] as const,
      queryFn: () => fetchAdminCategories() as Promise<AdminCategory[] | null>,
      staleTime: 10_000,
    }),
  attributeSets: () =>
    queryOptions({
      queryKey: ["admin", "attribute-sets"] as const,
      queryFn: () => fetchAdminAttributeSets() as Promise<AttributeSet[] | null>,
      staleTime: 10_000,
    }),
  orders: (search: { status?: string; page?: number } = {}) =>
    queryOptions({
      queryKey: ["admin", "orders", search] as const,
      queryFn: () =>
        fetchAdminOrders({ data: search }) as Promise<AdminOrderListResponse | null>,
      staleTime: 5_000,
    }),
  order: (id: number) =>
    queryOptions({
      queryKey: ["admin", "order", id] as const,
      queryFn: () =>
        fetchAdminOrder({ data: { id } }) as Promise<OrderDetail | null>,
      staleTime: 1_000,
    }),
  products: (q: string = "") =>
    queryOptions({
      queryKey: ["admin", "products", q] as const,
      queryFn: () =>
        fetchAdminProducts({ data: { q } }) as Promise<AdminProductRow[] | null>,
      staleTime: 10_000,
    }),
};
