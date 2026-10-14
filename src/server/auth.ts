import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import type { Me } from "@/lib/auth-types";

const API_BASE =
  process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:8000/api";

/**
 * SSR-side fetch of /api/auth/me. Forwards the incoming browser Cookie header
 * to FastAPI so route loaders can render personalised pages during SSR.
 */
export const fetchMe = createServerFn({ method: "GET" }).handler(
  async (): Promise<Me | null> => {
    const cookie = getRequestHeader("cookie") ?? "";
    if (!cookie.includes("sid=")) return null;
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { cookie, accept: "application/json" },
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return (await res.json()) as Me;
  },
);

export const authQueries = {
  me: () =>
    queryOptions({
      queryKey: ["auth", "me"] as const,
      queryFn: () => fetchMe() as Promise<Me | null>,
      staleTime: 60_000,
    }),
};
