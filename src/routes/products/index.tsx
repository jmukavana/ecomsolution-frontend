import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useState } from "react";

import {
  catalogQueries,
  productListSearchSchema,
  type ProductListSearch,
} from "@/server/catalog";
import { ProductCard } from "@/components/catalog/ProductCard";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/products/")({
  validateSearch: productListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catalogQueries.categories()),
      context.queryClient.ensureQueryData(catalogQueries.products(deps)),
    ]);
  },
  pendingComponent: ProductsPendingSkeleton,
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: categories } = useSuspenseQuery(catalogQueries.categories());
  const { data: list } = useSuspenseQuery(catalogQueries.products(search));

  // Local search input that debounces into URL search params so typing feels instant
  const [qInput, setQInput] = useState(search.q ?? "");
  const deferredQ = useDeferredValue(qInput);
  useEffect(() => {
    const next = deferredQ.trim();
    if ((search.q ?? "") === next) return;
    const t = setTimeout(() => {
      void navigate({
        search: (prev: ProductListSearch) => ({ ...prev, q: next || undefined, page: undefined }),
        replace: true,
      });
    }, 200);
    return () => clearTimeout(t);
  }, [deferredQ, navigate, search.q]);

  const update = (next: Partial<ProductListSearch>) => {
    void navigate({
      search: (prev: ProductListSearch) => ({ ...prev, ...next, page: undefined }),
    });
  };

  const reset = () => {
    setQInput("");
    void navigate({ search: () => ({}) });
  };

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-1">Shop</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          All Products
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <FilterPanel
          categories={categories}
          brands={list.filters.brands}
          attributes={list.filters.attributes}
          selected={{
            category: search.category ?? "",
            brand: search.brand ?? "",
            q: qInput,
            minPrice: search.min_price ?? "",
            maxPrice: search.max_price ?? "",
          }}
          onChange={(next) => {
            if (next.q !== undefined) {
              setQInput(next.q);
              return;
            }
            update({
              category: next.category || undefined,
              brand: next.brand || undefined,
              min_price: next.minPrice || undefined,
              max_price: next.maxPrice || undefined,
            });
          }}
          onReset={reset}
        />

        <section>
          <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{list.total} result(s)</span>
            {search.category && (
              <span>
                Category: <strong>{search.category}</strong>
              </span>
            )}
          </div>

          {list.items.length === 0 ? (
            <div className="island-shell rounded-2xl p-10 text-center text-sm text-muted-foreground">
              Nothing matches those filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProductsPendingSkeleton() {
  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-1">Shop</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          All Products
        </h1>
      </header>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Skeleton className="h-[420px] rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
