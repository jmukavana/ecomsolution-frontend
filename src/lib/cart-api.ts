import { api } from "@/lib/api";
import type {
  Cart,
  CheckoutResponse,
  OrderDetail,
  PaymentMethod,
  Quote,
} from "@/lib/cart-types";

export const cartApi = {
  get: () => api<Cart>("/cart"),
  add: (variant_id: number, qty: number) =>
    api<Cart>("/cart/items", { method: "POST", body: { variant_id, qty } }),
  updateQty: (item_id: number, qty: number) =>
    api<Cart>(`/cart/items/${item_id}`, { method: "PATCH", body: { qty } }),
  remove: (item_id: number) =>
    api<Cart>(`/cart/items/${item_id}`, { method: "DELETE" }),
  clear: () => api<Cart>("/cart/clear", { method: "POST" }),

  quote: (county: string) =>
    api<Quote>("/cart/quote", { method: "POST", body: { county } }),

  checkout: (payload: {
    payment_method: PaymentMethod;
    shipping_address: {
      full_name: string;
      county: string;
      town: string;
      street?: string;
      landmark?: string;
      phone: string;
      notes?: string;
    };
    customer_email: string;
    customer_phone: string;
    customer_name?: string;
  }) => api<CheckoutResponse>("/checkout", { method: "POST", body: payload }),

  order: (id: number) => api<OrderDetail>(`/orders/${id}`),
};

// Re-export the SSR-aware query options so call-sites stay consistent.
// Read loaders should use these; mutations call `cartApi.*` directly (they're
// user-initiated and run client-side where credentials:include + CSRF works).
export { cartSsrQueries as cartQueries } from "@/server/cart";
