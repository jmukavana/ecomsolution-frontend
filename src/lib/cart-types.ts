export interface CartItem {
  id: number;
  variant_id: number;
  sku: string;
  qty: number;
  unit_price: string;
  line_total: string;
  stock: number;
  product: {
    id: number;
    slug: string;
    name: string;
    brand: string | null;
    image: string | null;
  };
  options: Record<string, string>;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: string;
  total_weight_kg: string;
  item_count: number;
}

export interface Quote {
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  eta_days: number;
  county: string;
}

export type PaymentMethod = "mpesa" | "cod";
export type OrderStatus =
  | "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: number;
  qty: number;
  unit_price: string;
  product_name: string;
  sku: string;
  options: Record<string, string>;
}

export interface PaymentRow {
  id: number;
  provider: PaymentMethod;
  status: "initiated" | "success" | "failed";
  amount: string;
  checkout_request_id: string | null;
  mpesa_receipt: string | null;
  completed_at: string | null;
}

export interface OrderDetail {
  id: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  shipping_address: Record<string, string>;
  customer_email: string;
  customer_phone: string;
  customer_name: string | null;
  created_at: string;
  items: OrderItem[];
  payments: PaymentRow[];
}

export interface CheckoutResponse {
  order_id: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total: string;
  next: "mpesa_prompt" | "cod_confirmation";
  checkout_request_id: string | null;
  customer_message: string | null;
}
