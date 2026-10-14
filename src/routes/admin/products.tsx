import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useState } from "react";
import { z } from "zod";

import { adminApi } from "@/lib/admin-api";
import { adminQueries } from "@/server/admin";
import type { AdminProductRow } from "@/lib/admin-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKES } from "@/lib/format";
import { ApiError } from "@/lib/api";

const productsSearch = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/admin/products")({
  validateSearch: productsSearch,
  loaderDeps: ({ search }) => ({ q: search.q ?? "" }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(adminQueries.products(deps.q));
  },
  component: AdminProductsList,
});

function AdminProductsList() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [qInput, setQInput] = useState(search.q ?? "");
  const deferredQ = useDeferredValue(qInput);

  useEffect(() => {
    if ((search.q ?? "") === deferredQ.trim()) return;
    const t = setTimeout(() => {
      void navigate({
        search: () => (deferredQ.trim() ? { q: deferredQ.trim() } : {}),
        replace: true,
      });
    }, 200);
    return () => clearTimeout(t);
  }, [deferredQ, navigate, search.q]);

  const { data: products } = useSuspenseQuery(adminQueries.products(search.q ?? ""));

  const togglePatch = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<AdminProductRow> }) =>
      adminApi.patchProductBasics(id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="island-kicker mb-1">Admin</p>
          <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">Products</h1>
        </div>
        <Input
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Search by name or brand…"
          className="max-w-xs"
        />
      </header>

      <Card className="island-shell">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--line)] text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3 text-right">Base price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((p) => (
                <tr key={p.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-2">
                    <p className="m-0 font-semibold">{p.name}</p>
                    <p className="m-0 text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-2">{p.brand ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    {p.base_price_kes ? formatKES(p.base_price_kes) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {p.is_featured && (
                      <Badge variant="outline" className="ml-1.5">Featured</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={togglePatch.isPending}
                        onClick={() =>
                          togglePatch.mutate({ id: p.id, body: { is_active: !p.is_active } })
                        }
                      >
                        {p.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={togglePatch.isPending}
                        onClick={() =>
                          togglePatch.mutate({ id: p.id, body: { is_featured: !p.is_featured } })
                        }
                      >
                        {p.is_featured ? "Unfeature" : "Feature"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!products || products.length === 0) && (
            <p className="m-0 px-4 py-6 text-center text-sm text-muted-foreground">
              No products.
            </p>
          )}
          {togglePatch.error && (
            <p className="m-0 px-4 pb-3 text-xs text-red-600">
              {togglePatch.error instanceof ApiError ? togglePatch.error.message : "Couldn't update."}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="m-0 text-xs text-muted-foreground">
        Full create / variants / attributes editor coming in Phase 7. For now, seed scripts + the
        admin API support these operations.
      </p>
    </div>
  );
}
