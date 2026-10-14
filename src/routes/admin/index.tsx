import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { adminQueries } from "@/server/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKES } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(adminQueries.stats());
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useSuspenseQuery(adminQueries.stats());
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <header>
        <p className="island-kicker mb-1">Dashboard</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">
          Today
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Orders today" value={stats.orders_today} />
        <Kpi label="Pending" value={stats.orders_pending} hint="awaiting payment" />
        <Kpi label="To dispatch" value={stats.orders_paid_unshipped} hint="paid + processing" />
        <Kpi
          label="Revenue this month"
          value={formatKES(stats.revenue_this_month)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="island-shell">
          <CardContent className="space-y-3 p-5">
            <p className="island-kicker">Orders by status (30d)</p>
            <ul className="m-0 list-none space-y-1.5 p-0 text-sm">
              {Object.entries(stats.orders_by_status).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span className="capitalize">{k}</span>
                  <span className="font-semibold">{v}</span>
                </li>
              ))}
            </ul>
            {stats.payments_failed_recent > 0 && (
              <p className="m-0 mt-2 text-xs text-amber-700">
                ⚠ {stats.payments_failed_recent} payment(s) failed in the last 7 days.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="island-shell">
          <CardContent className="space-y-3 p-5">
            <p className="island-kicker">Low stock</p>
            {stats.low_stock.length === 0 ? (
              <p className="m-0 text-sm text-muted-foreground">All variants healthy.</p>
            ) : (
              <ul className="m-0 list-none space-y-1.5 p-0 text-sm">
                {stats.low_stock.map((row) => (
                  <li key={row.variant_id} className="flex items-center justify-between gap-2">
                    <Link
                      to="/products/$slug"
                      params={{ slug: row.product_slug }}
                      className="truncate text-[var(--sea-ink)] no-underline hover:underline"
                    >
                      {row.product_name}{" "}
                      <span className="text-xs text-muted-foreground">({row.sku})</span>
                    </Link>
                    <Badge variant={row.stock === 0 ? "destructive" : "secondary"}>
                      {row.stock} left
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="island-shell feature-card">
      <CardContent className="space-y-1 p-5">
        <p className="island-kicker">{label}</p>
        <p className="m-0 text-2xl font-bold text-[var(--sea-ink)]">{value}</p>
        {hint && <p className="m-0 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
