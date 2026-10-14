/**
 * Browser-side customer self-service mutations: profile, addresses, in-app
 * notification reads. These run client-side so the `api()` wrapper can attach
 * `credentials: 'include'` and mirror the `csrf` cookie into `X-CSRF-Token`.
 *
 * Reads are SSR-aware and live in `@/server/me` — re-exported below as
 * `meQueries` so route loaders (`ensureQueryData`) and components share them.
 */

import { api } from "@/lib/api";
import type { Me } from "@/lib/auth-types";
import type { Address, AddressInput, MyNotification, UnreadCount } from "@/lib/me-types";

export const meApi = {
  updateProfile: (body: { full_name?: string | null; phone?: string | null }) =>
    api<Me>("/me/profile", { method: "PATCH", body }),

  createAddress: (body: AddressInput) =>
    api<Address>("/me/addresses", { method: "POST", body }),
  updateAddress: (id: number, body: AddressInput) =>
    api<Address>(`/me/addresses/${id}`, { method: "PATCH", body }),
  deleteAddress: (id: number) =>
    api<void>(`/me/addresses/${id}`, { method: "DELETE" }),

  markNotificationRead: (id: number) =>
    api<MyNotification>(`/me/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () =>
    api<UnreadCount>("/me/notifications/read-all", { method: "POST" }),
};

// SSR-aware read queries — loaders prime them, components consume them.
export { meSsrQueries as meQueries } from "@/server/me";
