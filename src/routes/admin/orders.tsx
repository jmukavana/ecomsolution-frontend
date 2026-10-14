import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { adminQueries } from "@/server/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/format";

const STATUSES = ["", "pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;

const adminOrdersSearch = z.object({
  status: z.string().optional(),
  page: z.number().int().min(1).optional(),
});

export const Route = createFileRoute("/admin/orders")({
  validateSearch: adminOrdersSearch,
  loaderDeps: ({ search }) => ({ status: search.status, page: search.page ?? 1 }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(adminQueries.orders(deps));
  },
  component: AdminOrdersList,
});

function AdminOrdersList() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useSuspenseQuery(
    adminQueries.orders({ status: search.status, page: search.page ?? 1 }),
  );

  return (
    <div className="space-y-5">
      <header>
        <p className="island-kicker mb-1">Admin</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">
          Orders
        </h1>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => {
          const isActive = (search.status ?? "") === s;
          return (
            <button
              key={s || "all"}
              type="button"
              onClick={() =>
                void navigate({
                  search: () => (s ? { status: s } : {}),
                })
              }
              className={`rounded-full border px-3 py-1 text-xs transition ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-accent"
              }`}
            >
              {s || "All"}
            </button>
          );
        })}
      </div>

      {!data || data.items.length === 0 ? (
        <Card className="island-shell">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No orders match.
          </CardContent>
        </Card>
      ) : (
        <Card className="island-shell">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--line)] text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Placed</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">#{o.id}</td>
                    <td className="px-4 py-2">
                      <p className="m-0">{o.customer_name ?? "—"}</p>
                      <p className="m-0 text-xs text-muted-foreground">
                        {o.customer_email}
                      </p>
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          o.status === "paid" || o.status === "delivered"
                            ? "default"
                            : o.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {o.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 uppercase text-xs">
                      {o.payment_method}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatKES(o.total)}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to="/admin/orders/$id"
                          params={{ id: String(o.id) }}
                        >
                          Open
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data && data.total > data.page_size && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={(search.page ?? 1) <= 1}
            onClick={() =>
              void navigate({
                search: (prev) => ({ ...prev, page: ((prev.page ?? 1) - 1) || 1 }),
              })
            }
          >
            ← Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {data.page} / {Math.ceil(data.total / data.page_size)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(search.page ?? 1) * data.page_size >= data.total}
            onClick={() =>
              void navigate({
                search: (prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }),
              })
            }
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
