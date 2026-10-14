import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";

import { cartApi, cartQueries } from "@/lib/cart-api";
import { ApiError } from "@/lib/api";
import { authQueries } from "@/server/auth";
import { KENYAN_COUNTIES } from "@/lib/counties";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatKES } from "@/lib/format";
import type { PaymentMethod } from "@/lib/cart-types";

export const Route = createFileRoute("/checkout")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(cartQueries.cart());
  },
  component: CheckoutPage,
});

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  county: string;
  town: string;
  street: string;
  landmark: string;
  notes: string;
  payment_method: PaymentMethod;
}

const DEFAULT: FormState = {
  full_name: "",
  email: "",
  phone: "",
  county: "Nairobi",
  town: "",
  street: "",
  landmark: "",
  notes: "",
  payment_method: "cod",
};

function CheckoutPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: cartOrNull } = useSuspenseQuery(cartQueries.cart());
  const cart = cartOrNull ?? { id: 0, items: [], subtotal: "0.00", total_weight_kg: "0", item_count: 0 };
  const { data: me } = useQuery(authQueries.me());

  const [form, setForm] = useState<FormState>(() => ({
    ...DEFAULT,
    email: me?.email ?? "",
    full_name: me?.full_name ?? "",
    phone: me?.phone ?? "",
  }));

  const quote = useQuery({
    queryKey: ["cart", "quote", form.county],
    queryFn: () => cartApi.quote(form.county),
    enabled: !!form.county && cart.items.length > 0,
    staleTime: 30_000,
  });

  const checkout = useMutation({
    mutationFn: () =>
      cartApi.checkout({
        payment_method: form.payment_method,
        shipping_address: {
          full_name: form.full_name,
          county: form.county,
          town: form.town,
          street: form.street || undefined,
          landmark: form.landmark || undefined,
          phone: form.phone,
          notes: form.notes || undefined,
        },
        customer_email: form.email,
        customer_phone: form.phone,
        customer_name: form.full_name || undefined,
      }),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: cartQueries.cart().queryKey });
      void navigate({ to: "/orders/$id", params: { id: String(res.order_id) } });
    },
  });

  if (cart.items.length === 0) {
    return (
      <main className="page-wrap px-4 pb-10 pt-10">
        <p className="m-0 text-sm text-muted-foreground">
          Your cart is empty. <a href="/products">Shop products →</a>
        </p>
      </main>
    );
  }

  const set = (k: keyof FormState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-1">Checkout</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">
          Where should we send it?
        </h1>
      </header>

      <form
        className="grid gap-6 lg:grid-cols-[1fr_320px]"
        onSubmit={(e) => {
          e.preventDefault();
          checkout.mutate();
        }}
      >
        <div className="space-y-5">
          <Card className="island-shell">
            <CardContent className="space-y-4 p-5">
              <p className="island-kicker">Contact</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" required value={form.full_name} onChange={(v) => set("full_name", v)} />
                <Field label="Email" type="email" required value={form.email} onChange={(v) => set("email", v)} />
                <Field label="Phone" required placeholder="07XX XXX XXX" value={form.phone} onChange={(v) => set("phone", v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="island-shell">
            <CardContent className="space-y-4 p-5">
              <p className="island-kicker">Delivery address</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="county" className="mb-1.5 block">County</Label>
                  <select
                    id="county"
                    value={form.county}
                    onChange={(e) => set("county", e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    {KENYAN_COUNTIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Field label="Town / estate" required value={form.town} onChange={(v) => set("town", v)} />
                <Field label="Street" value={form.street} onChange={(v) => set("street", v)} />
                <Field label="Landmark" value={form.landmark} onChange={(v) => set("landmark", v)} />
              </div>
              <Field label="Notes for the courier" value={form.notes} onChange={(v) => set("notes", v)} />
            </CardContent>
          </Card>

          <Card className="island-shell">
            <CardContent className="space-y-3 p-5">
              <p className="island-kicker">Payment</p>
              <div className="space-y-2">
                <PaymentOption
                  value="mpesa"
                  selected={form.payment_method}
                  onSelect={(v) => set("payment_method", v)}
                  label="M-Pesa (STK Push)"
                  desc="You'll get a prompt on your phone to confirm."
                />
                <PaymentOption
                  value="cod"
                  selected={form.payment_method}
                  onSelect={(v) => set("payment_method", v)}
                  label="Cash on Delivery"
                  desc="Pay the courier on receipt."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card className="island-shell sticky top-24">
            <CardContent className="space-y-3 p-5">
              <p className="island-kicker">Order summary</p>
              <ul className="m-0 list-none space-y-1.5 p-0 text-sm">
                {cart.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span className="truncate">
                      {i.product.name} <span className="text-muted-foreground">× {i.qty}</span>
                    </span>
                    <span className="font-medium">{formatKES(i.line_total)}</span>
                  </li>
                ))}
              </ul>
              <Separator />
              <Row label="Subtotal" value={formatKES(cart.subtotal)} />
              <Row
                label="Shipping"
                value={quote.isLoading ? "—" : formatKES(quote.data?.shipping ?? 0)}
              />
              {quote.data && (
                <p className="m-0 text-[10px] text-muted-foreground">
                  ETA ~{quote.data.eta_days} day{quote.data.eta_days > 1 ? "s" : ""}.
                </p>
              )}
              <Separator />
              <Row
                label="Total"
                value={quote.isLoading ? "—" : formatKES(quote.data?.total ?? cart.subtotal)}
                bold
              />
              {checkout.error && (
                <p className="m-0 text-xs text-red-600">
                  {checkout.error instanceof ApiError
                    ? checkout.error.message
                    : "Couldn't place order."}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  checkout.isPending
                  || quote.isLoading
                  || !form.full_name
                  || !form.email
                  || !form.phone
                  || !form.town
                }
              >
                {checkout.isPending
                  ? "Placing order…"
                  : form.payment_method === "mpesa"
                  ? "Pay with M-Pesa"
                  : "Place order"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </main>
  );
}

function Field({
  label, value, onChange, required, type, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; placeholder?: string;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block">{label}{required ? " *" : ""}</Label>
      <Input id={id} type={type ?? "text"} required={required} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PaymentOption({
  value, selected, onSelect, label, desc,
}: {
  value: PaymentMethod; selected: PaymentMethod;
  onSelect: (v: PaymentMethod) => void; label: string; desc: string;
}) {
  const active = selected === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full rounded-lg border p-3 text-left transition ${
        active ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
      }`}
    >
      <p className="m-0 text-sm font-semibold">{label}</p>
      <p className="m-0 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
