import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { cartQueries } from "@/lib/cart-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatKES } from "@/lib/format";

export const Route = createFileRoute("/orders/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      cartQueries.order(Number(params.id)),
    );
  },
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const orderId = Number(id);
  const { data: order } = useSuspenseQuery({
    ...cartQueries.order(orderId),
    refetchInterval: (q) => {
      const o = q.state.data;
      if (!o) return 2_000;
      if (o.status === "pending" && o.payment_method === "mpesa") return 2_000;
      return false;
    },
  });
  if (!order) {
    return (
      <main className="page-wrap px-4 pb-10 pt-10">
        <div className="island-shell rounded-2xl p-8 text-center">
          <h1 className="m-0 text-xl font-semibold">Order not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been removed, or you don't have access.
          </p>
        </div>
      </main>
    );
  }

  const lastPayment = order.payments.at(-1);
  const isWaitingForMpesa =
    order.status === "pending"
    && order.payment_method === "mpesa"
    && lastPayment?.status === "initiated";

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-1">Order #{order.id}</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">
          {statusHeadline(order.status, order.payment_method)}
        </h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          <Badge variant={order.status === "paid" ? "default" : "secondary"} className="mr-2">
            {order.status}
          </Badge>
          {order.payment_method.toUpperCase()} ·{" "}
          <Link to="/products" className="hover:underline">Continue shopping →</Link>
        </p>
      </header>

      {isWaitingForMpesa && (
        <Card className="island-shell mb-5 border-amber-300 bg-amber-50/60">
          <CardContent className="p-5">
            <p className="m-0 text-sm font-semibold text-amber-900">
              Check your phone for the M-Pesa prompt.
            </p>
            <p className="m-0 mt-1 text-xs text-amber-900">
              We're waiting for Safaricom to confirm payment. This page will
              update automatically.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="island-shell">
          <CardContent className="p-5">
            <p className="island-kicker mb-3">Items</p>
            <ul className="m-0 list-none space-y-2 p-0">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="m-0 font-medium">{item.product_name}</p>
                    <p className="m-0 text-xs text-muted-foreground">
                      SKU {item.sku}
                      {Object.keys(item.options).length > 0 && (
                        <> · {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(" · ")}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="m-0">× {item.qty}</p>
                    <p className="m-0 text-xs text-muted-foreground">
                      {formatKES(item.unit_price)} each
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <aside className="space-y-5">
          <Card className="island-shell">
            <CardContent className="space-y-2 p-5">
              <p className="island-kicker">Summary</p>
              <Row label="Subtotal" value={formatKES(order.subtotal)} />
              <Row label="Shipping" value={formatKES(order.shipping)} />
              <Separator />
              <Row label="Total" value={formatKES(order.total)} bold />
              {lastPayment?.mpesa_receipt && (
                <p className="m-0 text-xs text-muted-foreground">
                  M-Pesa receipt: <strong>{lastPayment.mpesa_receipt}</strong>
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="island-shell">
            <CardContent className="space-y-1 p-5 text-sm">
              <p className="island-kicker">Delivery to</p>
              <p className="m-0 font-medium">{order.shipping_address.full_name}</p>
              <p className="m-0 text-muted-foreground">
                {order.shipping_address.street && <>{order.shipping_address.street}, </>}
                {order.shipping_address.town}, {order.shipping_address.county}
              </p>
              <p className="m-0 text-muted-foreground">{order.customer_phone}</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function statusHeadline(status: string, method: string): string {
  if (status === "pending") return method === "mpesa" ? "Waiting for M-Pesa…" : "Order placed";
  if (status === "processing") return "Order being prepared";
  if (status === "paid") return "Payment confirmed 🎉";
  if (status === "shipped") return "On the way";
  if (status === "delivered") return "Delivered";
  if (status === "cancelled") return "Cancelled";
  return status;
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
