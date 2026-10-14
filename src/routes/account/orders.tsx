import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueries } from "@/lib/me-api";
import type { OrderSummary } from "@/lib/me-types";
import { formatKES } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/account/orders")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(meQueries.orders());
  },
  component: OrdersPage,
});

const STATUS_VARIANT: Record<
  OrderSummary["status"],
  "default" | "secondary" | "outline"
> = {
  pending: "outline",
  paid: "default",
  processing: "secondary",
  shipped: "secondary",
  delivered: "default",
  cancelled: "outline",
};

function OrdersPage() {
  const { data } = useSuspenseQuery(meQueries.orders());
  const orders = data ?? [];

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-1">My account</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          Order history
        </h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Track every order you've placed and check its delivery status.
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="island-shell rounded-2xl p-8 text-center">
          <p className="m-0 text-base font-semibold text-[var(--sea-ink)]">
            No orders yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            When you place an order it'll show up here with its status.
          </p>
          <Link
            to="/products"
            className="mt-4 inline-block rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to="/orders/$id"
                params={{ id: String(o.id) }}
                className="block no-underline"
              >
                <Card className="island-shell feature-card">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                        Order #{o.id}
                        <Badge
                          variant={STATUS_VARIANT[o.status]}
                          className="ml-2 capitalize"
                        >
                          {o.status}
                        </Badge>
                      </p>
                      <p className="m-0 text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()} ·{" "}
                        {o.item_count} item{o.item_count === 1 ? "" : "s"} ·{" "}
                        {o.payment_method === "mpesa" ? "M-Pesa" : "Cash on delivery"}
                      </p>
                    </div>
                    <span className="text-base font-semibold text-[var(--sea-ink)]">
                      {formatKES(o.total)}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
