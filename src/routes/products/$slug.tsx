import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { catalogQueries } from "@/server/catalog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { VariantPicker } from "@/components/catalog/VariantPicker";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(catalogQueries.product(params.slug));
    } catch (e) {
      throw notFound({ data: e instanceof Error ? e.message : String(e) });
    }
  },
  pendingComponent: DetailSkeleton,
  notFoundComponent: NotFoundView,
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(catalogQueries.product(slug));
  const hero = data.images?.[0];

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link to="/products" className="hover:underline">
          ← All products
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="island-shell aspect-square overflow-hidden rounded-2xl bg-muted">
          {hero ? (
            <img
              src={hero.url}
              alt={hero.alt ?? data.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            {data.brand && <p className="island-kicker mb-2">{data.brand}</p>}
            <h1 className="display-title m-0 text-3xl font-bold text-(--sea-ink) sm:text-4xl">
              {data.name}
            </h1>
            {data.is_featured && (
              <Badge variant="default" className="mt-2">
                Featured
              </Badge>
            )}
          </div>

          {data.description && (
            <p className="m-0 text-sm leading-relaxed text-(--sea-ink-soft)">
              {data.description}
            </p>
          )}

          <Separator />

          <VariantPicker variants={data.variants} />

          {Object.keys(data.attributes).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="island-kicker mb-2">Specifications</p>
                <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {Object.entries(data.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <dt className="capitalize text-muted-foreground">
                        {key.replace(/_/g, " ")}
                      </dt>
                      <dd className="m-0 text-right text-(--sea-ink)">
                        {formatAttributeValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function DetailSkeleton() {
  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-1/3" />
        </div>
      </div>
    </main>
  );
}

function NotFoundView() {
  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <div className="island-shell rounded-2xl p-8 text-center">
        <h1 className="m-0 text-xl font-semibold">Product not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That product doesn't exist or is no longer available.
        </p>
        <Link
          to="/products"
          className="mt-4 inline-block text-sm text-(--lagoon-deep) underline"
        >
          Back to catalogue
        </Link>
      </div>
    </main>
  );
}

function formatAttributeValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
