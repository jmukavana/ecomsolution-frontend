import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { adminQueries } from "@/server/admin";
import type { OrderStatus } from "@/lib/cart-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { formatKES } from "@/lib/format";

export const Route = createFileRoute("/admin/orders/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      adminQueries.order(Number(params.id)),
    );
  },
  component: AdminOrderDetail,
});

const ALLOWED: Record<OrderStatus, Array<{ next: OrderStatus; label: string; needsShip?: boolean }>> = {
  pending: [
    { next: "paid", label: "Mark paid" },
    { next: "processing", label: "Move to processing" },
    { next: "cancelled", label: "Cancel" },
  ],
  paid: [
    { next: "processing", label: "Move to processing" },
    { next: "cancelled", label: "Cancel" },
  ],
  processing: [
    { next: "paid", label: "Mark paid" },
    { next: "shipped", label: "Mark shipped", needsShip: true },
    { next: "cancelled", label: "Cancel" },
  ],
  shipped: [
    { next: "delivered", label: "Mark delivered" },
    { next: "cancelled", label: "Cancel" },
  ],
  delivered: [],
  cancelled: [],
};

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const orderId = Number(id);
  const queryClient = useQueryClient();
  const { data: order } = useSuspenseQuery(adminQueries.order(orderId));

  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");

  const transition = useMutation({
    mutationFn: (next: OrderStatus) =>
      adminApi.transitionStatus(orderId, next, next === "shipped" ? { courier, tracking } : undefined),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  if (!order) {
    return (
      <Card className="island-shell">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Order not found.
        </CardContent>
      </Card>
    );
  }

  const actions = ALLOWED[order.status];

  return (
    <div className="space-y-5">
      <header>
        <p className="island-kicker mb-1">
          <Link to="/admin/orders" className="hover:underline">← All orders</Link>
        </p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">
          Order #{order.id}
        </h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          <Badge variant="secondary" className="mr-2">{order.status}</Badge>
          {order.payment_method.toUpperCase()} ·{" "}
          {new Date(order.created_at).toLocaleString()}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="island-shell">
            <CardContent className="space-y-3 p-5">
              <p className="island-kicker">Items</p>
              <ul className="m-0 list-none space-y-2 p-0">
                {order.items.map((i) => (
                  <li key={i.id} className="flex justify-between text-sm">
                    <span>
                      {i.product_name}{" "}
                      <span className="text-xs text-muted-foreground">
                        {Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        {Object.keys(i.options).length > 0 ? " · " : ""}SKU {i.sku}
                      </span>
                    </span>
                    <span className="font-medium">
                      × {i.qty} · {formatKES(i.unit_price)}
                    </span>
                  </li>
                ))}
              </ul>
              <Separator />
              <div className="text-right text-sm">
                <p className="m-0">Subtotal: <strong>{formatKES(order.subtotal)}</strong></p>
                <p className="m-0">Shipping: {formatKES(order.shipping)}</p>
                <p className="m-0 mt-1 text-base font-bold">Total: {formatKES(order.total)}</p>
              </div>
            </CardContent>
          </Card>

          {actions.length > 0 ? (
            <Card className="island-shell">
              <CardContent className="space-y-3 p-5">
                <p className="island-kicker">Actions</p>
                {actions.some((a) => a.needsShip) && order.status === "processing" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="courier" className="mb-1 block text-xs">Courier (optional)</Label>
                      <Input id="courier" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Sendy / G4S / …" />
                    </div>
                    <div>
                      <Label htmlFor="tracking" className="mb-1 block text-xs">Tracking (optional)</Label>
                      <Input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="ABC123" />
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <Button
                      key={a.next}
                      variant={a.next === "cancelled" ? "destructive" : "default"}
                      size="sm"
                      disabled={transition.isPending}
                      onClick={() => transition.mutate(a.next)}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
                {transition.error && (
                  <p className="m-0 text-sm text-red-600">
                    {transition.error instanceof ApiError ? transition.error.message : "Couldn't transition."}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="island-shell">
              <CardContent className="p-5 text-sm text-muted-foreground">
                This order is terminal — no further status transitions allowed.
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="island-shell">
            <CardContent className="space-y-2 p-5 text-sm">
              <p className="island-kicker">Customer</p>
              <p className="m-0 font-medium">{order.customer_name ?? "—"}</p>
              <p className="m-0 text-muted-foreground">{order.customer_email}</p>
              <p className="m-0 text-muted-foreground">{order.customer_phone}</p>
            </CardContent>
          </Card>
          <Card className="island-shell">
            <CardContent className="space-y-2 p-5 text-sm">
              <p className="island-kicker">Shipping to</p>
              <p className="m-0">{order.shipping_address.full_name}</p>
              <p className="m-0 text-muted-foreground">
                {order.shipping_address.street && <>{order.shipping_address.street}, </>}
                {order.shipping_address.town}, {order.shipping_address.county}
              </p>
              {order.shipping_address.landmark && (
                <p className="m-0 text-xs text-muted-foreground">
                  Near {order.shipping_address.landmark}
                </p>
              )}
            </CardContent>
          </Card>
          {order.payments.length > 0 && (
            <Card className="island-shell">
              <CardContent className="space-y-2 p-5 text-sm">
                <p className="island-kicker">Payments</p>
                {order.payments.map((p) => (
                  <div key={p.id} className="text-xs">
                    <p className="m-0">
                      <Badge
                        variant={
                          p.status === "success"
                            ? "default"
                            : p.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {p.status}
                      </Badge>{" "}
                      {p.provider.toUpperCase()} · {formatKES(p.amount)}
                    </p>
                    {p.mpesa_receipt && (
                      <p className="m-0 text-muted-foreground">Receipt: {p.mpesa_receipt}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
