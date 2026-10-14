/**
 * SSR-side fetches for the customer self-service area. These run server-side,
 * forward the browser's Cookie header to FastAPI, and propagate any Set-Cookie
 * back. Route loaders prime these via `ensureQueryData` so pages render with
 * data on the first paint; mutations live in `lib/me-api.ts` and run client-side.
 */

import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

import type { SessionRow } from "@/lib/auth-types";
import type {
  Address,
  MyNotification,
  OrderSummary,
  UnreadCount,
} from "@/lib/me-types";

const API_BASE =
  process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function proxy<T>(path: string): Promise<T | null> {
  const cookie = getRequestHeader("cookie") ?? "";
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { cookie, accept: "application/json" },
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) setResponseHeader("set-cookie", setCookie);
  if (res.status === 401 || res.status === 403 || res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`backend ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export const fetchMyOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrderSummary[] | null> => proxy<OrderSummary[]>("/me/orders"),
);

export const fetchMyAddresses = createServerFn({ method: "GET" }).handler(
  async (): Promise<Address[] | null> => proxy<Address[]>("/me/addresses"),
);

export const fetchMyNotifications = createServerFn({ method: "GET" }).handler(
  async (): Promise<MyNotification[] | null> =>
    proxy<MyNotification[]>("/me/notifications"),
);

export const fetchMyUnreadCount = createServerFn({ method: "GET" }).handler(
  async (): Promise<UnreadCount | null> =>
    proxy<UnreadCount>("/me/notifications/unread-count"),
);

export const fetchMySessions = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionRow[] | null> => proxy<SessionRow[]>("/me/sessions"),
);

export const meSsrQueries = {
  orders: () =>
    queryOptions({
      queryKey: ["me", "orders"] as const,
      queryFn: () => fetchMyOrders() as Promise<OrderSummary[] | null>,
      staleTime: 15_000,
    }),
  addresses: () =>
    queryOptions({
      queryKey: ["me", "addresses"] as const,
      queryFn: () => fetchMyAddresses() as Promise<Address[] | null>,
      staleTime: 30_000,
    }),
  notifications: () =>
    queryOptions({
      queryKey: ["me", "notifications"] as const,
      queryFn: () => fetchMyNotifications() as Promise<MyNotification[] | null>,
      staleTime: 10_000,
    }),
  unreadCount: () =>
    queryOptions({
      queryKey: ["me", "notifications", "unread"] as const,
      queryFn: () => fetchMyUnreadCount() as Promise<UnreadCount | null>,
      staleTime: 10_000,
    }),
  sessions: () =>
    queryOptions({
      queryKey: ["me", "sessions"] as const,
      queryFn: () => fetchMySessions() as Promise<SessionRow[] | null>,
      staleTime: 10_000,
    }),
};
