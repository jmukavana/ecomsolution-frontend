/**
 * SSR-side cart + order fetches. These run server-side, forward the browser's
 * Cookie header to FastAPI, and propagate any Set-Cookie back so anonymous
 * cart sessions persist across navigation.
 */

import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

import type { Cart, OrderDetail } from "@/lib/cart-types";

const API_BASE =
  process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function proxy<T>(path: string): Promise<T | null> {
  const cookie = getRequestHeader("cookie") ?? "";
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { cookie, accept: "application/json" },
  });

  // Surface any Set-Cookie (anonymous cart_session) to the browser
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) setResponseHeader("set-cookie", setCookie);

  if (res.status === 401 || res.status === 403 || res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`backend ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export const fetchCartSSR = createServerFn({ method: "GET" }).handler(
  async (): Promise<Cart | null> => proxy<Cart>("/cart"),
);

export const fetchOrderSSR = createServerFn({ method: "GET" })
  .inputValidator((data: { id: number }) => ({ id: Number(data.id) }))
  .handler(async ({ data }): Promise<OrderDetail | null> =>
    proxy<OrderDetail>(`/orders/${data.id}`),
  );

export const cartSsrQueries = {
  cart: () =>
    queryOptions({
      queryKey: ["cart"] as const,
      queryFn: () => fetchCartSSR() as Promise<Cart | null>,
      staleTime: 5_000,
    }),
  order: (id: number) =>
    queryOptions({
      queryKey: ["order", id] as const,
      queryFn: () => fetchOrderSSR({ data: { id } }) as Promise<OrderDetail | null>,
      staleTime: 1_000,
    }),
};
