/** Admin browser-side mutations (use cookies + CSRF via the api wrapper). */

import { api } from "@/lib/api";
import type {
  AdminCategory,
  AdminProductRow,
  AttributeSet,
  AttributeSetInput,
  CategoryInput,
  OrderDetail,
} from "@/lib/admin-types";

export const adminApi = {
  transitionStatus: (orderId: number, next: string, opts?: { courier?: string; tracking?: string }) =>
    api<OrderDetail>(`/admin/orders/${orderId}/status`, {
      method: "PATCH",
      body: { status: next, courier: opts?.courier, tracking: opts?.tracking },
    }),

  patchProductBasics: (productId: number, body: Partial<AdminProductRow> & { description?: string }) =>
    api<AdminProductRow>(`/admin/catalog/products/${productId}/basics`, {
      method: "PATCH",
      body,
    }),

  // ---------- Categories ----------
  createCategory: (body: CategoryInput) =>
    api<AdminCategory>("/admin/catalog/categories", { method: "POST", body }),
  updateCategory: (id: number, body: CategoryInput) =>
    api<AdminCategory>(`/admin/catalog/categories/${id}`, { method: "PUT", body }),
  deleteCategory: (id: number) =>
    api<void>(`/admin/catalog/categories/${id}`, { method: "DELETE" }),

  // ---------- Attribute sets ----------
  createAttributeSet: (body: AttributeSetInput) =>
    api<AttributeSet>("/admin/catalog/attribute-sets", { method: "POST", body }),
  updateAttributeSet: (id: number, body: AttributeSetInput) =>
    api<AttributeSet>(`/admin/catalog/attribute-sets/${id}`, { method: "PUT", body }),
  deleteAttributeSet: (id: number) =>
    api<void>(`/admin/catalog/attribute-sets/${id}`, { method: "DELETE" }),
};
