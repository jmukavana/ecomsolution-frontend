import type { OrderStatus, PaymentMethod } from "@/lib/cart-types";

/** JSON-serializable value — keeps server-fn return types serializable. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Address {
  id: number;
  county: string;
  town: string;
  street: string | null;
  landmark: string | null;
  phone: string;
  is_default: boolean;
}

export interface AddressInput {
  county: string;
  town: string;
  street?: string | null;
  landmark?: string | null;
  phone: string;
  is_default?: boolean;
}

export interface OrderSummary {
  id: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total: string;
  item_count: number;
  created_at: string;
}

export interface MyNotification {
  id: number;
  type: string;
  title: string | null;
  body: string;
  payload: Record<string, JsonValue>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface UnreadCount {
  unread: number;
}
