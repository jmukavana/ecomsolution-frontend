import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Banknote, ShieldCheck, Smartphone, Truck } from "lucide-react";

import { catalogQueries } from "@/server/catalog";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductSummary } from "@/lib/catalog-types";

const FEATURED = { featured: true, page_size: 8 } as const;

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catalogQueries.products(FEATURED)),
      context.queryClient.ensureQueryData(catalogQueries.categories()),
    ]);
  },
  pendingComponent: HomePending,
  component: Home,
});

const TRUST = [
  { icon: Truck, title: "Nationwide delivery", sub: "All 47 counties" },
  { icon: Smartphone, title: "Pay with M-Pesa", sub: "Instant STK push" },
  { icon: Banknote, title: "Cash on delivery", sub: "Pay when it arrives" },
  { icon: ShieldCheck, title: "VAT included", sub: "Prices in KES, no surprises" },
] as const;

function Home() {
  const { data: featured } = useSuspenseQuery(catalogQueries.products(FEATURED));
  const { data: categories } = useSuspenseQuery(catalogQueries.categories());
  const topCategories = categories.slice(0, 8);
  const heroShots = featured.items
    .filter((p) => p.images?.[0]?.url)
    .slice(0, 4);

  return (
    <main className="page-wrap px-4 pb-16 pt-10">
      {/* ---------- Hero ---------- */}
      <section className="rise-in relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/12 via-card to-card shadow-sm">
        <div
          className={`grid items-center gap-8 px-6 py-12 sm:px-12 sm:py-16 ${
            heroShots.length > 0 ? "lg:grid-cols-2" : ""
          }`}
        >
          <div>
            <p className="island-kicker mb-3">
              Delivered across Kenya · M-Pesa & cash on delivery
            </p>
            <h1 className="display-title mb-5 text-4xl leading-[1.05] text-foreground sm:text-5xl xl:text-6xl">
              The gear you want,{" "}
              <span className="relative whitespace-nowrap">
                paid the easy way
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1 h-[7px] rounded-full bg-primary/80"
                />
              </span>
              .
            </h1>
            <p className="mb-8 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              A curated catalogue of electronics and everyday essentials. Pay
              with M-Pesa or cash on delivery, and track every order to your
              county.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-sm transition hover:opacity-90"
              >
                Shop now
              </Link>
              <Link
                to="/products"
                search={{ featured: true }}
                className="inline-flex items-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground no-underline transition hover:bg-accent"
              >
                See featured
              </Link>
            </div>
          </div>

          {heroShots.length > 0 && <HeroCollage shots={heroShots} />}
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TRUST.map(({ icon: Icon, title, sub }) => (
          <div
            key={title}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-semibold text-foreground">
                {title}
              </p>
              <p className="m-0 truncate text-xs text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ---------- Category strip ---------- */}
      <section className="mt-12">
        <SectionHeading kicker="Browse" title="Shop by category" />
        <div className="flex flex-wrap gap-2">
          <Link
            to="/products"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground no-underline shadow-sm transition hover:opacity-90"
          >
            All products
          </Link>
          {topCategories.map((c) => (
            <Link
              key={c.id}
              to="/products"
              search={{ category: c.slug }}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground no-underline transition hover:border-primary hover:text-primary"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Featured ---------- */}
      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <SectionHeading kicker="For you" title="Featured products" />
          <Link
            to="/products"
            className="whitespace-nowrap text-sm font-semibold text-primary no-underline hover:underline"
          >
            View all →
          </Link>
        </div>

        {featured.items.length === 0 ? (
          <div className="island-shell rounded-2xl p-10 text-center text-sm text-muted-foreground">
            No featured products yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="island-kicker mb-1">{kicker}</p>
      <h2 className="m-0 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
    </div>
  );
}

function HeroCollage({ shots }: { shots: ProductSummary[] }) {
  return (
    <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
      <div className="grid gap-4">
        {shots.slice(0, 2).map((p) => (
          <CollageTile key={p.id} product={p} />
        ))}
      </div>
      <div className="grid gap-4 pt-8">
        {shots.slice(2, 4).map((p) => (
          <CollageTile key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function CollageTile({ product }: { product: ProductSummary }) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="block aspect-square overflow-hidden rounded-2xl border border-border bg-muted no-underline shadow-sm transition hover:-translate-y-1"
    >
      <img
        src={product.images[0].url}
        alt={product.images[0].alt ?? product.name}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </Link>
  );
}

function HomePending() {
  return (
    <main className="page-wrap px-4 pb-16 pt-10">
      <Skeleton className="h-80 rounded-3xl" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
        ))}
      </div>
    </main>
  );
}
