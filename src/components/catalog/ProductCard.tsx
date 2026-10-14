import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Heart, Loader2, Plus, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatKES } from "@/lib/format";
import { api } from "@/lib/api";
import { cartApi } from "@/lib/cart-api";
import type { ProductDetail, ProductSummary } from "@/lib/catalog-types";

/**
 * Placeholder rating, stable per product id. Reviews are out of v1 scope, so
 * this gives cards realistic richness now and can be swapped for a real
 * `rating`/`rating_count` field on ProductSummary later.
 */
function pseudoRating(id: number): { rating: number; count: number } {
  const rating = Math.min(5, Math.round((3.9 + ((id * 37) % 11) / 10) * 10) / 10);
  const count = 8 + ((id * 17) % 280);
  return { rating, count };
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={
            i < full
              ? "fill-primary text-primary"
              : "fill-transparent text-muted-foreground/35"
          }
        />
      ))}
    </span>
  );
}

export function ProductCard({ product }: { product: ProductSummary }) {
  const img = product.images?.[0];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { rating, count } = pseudoRating(product.id);

  // Wishlist: local-only for now (no backend wishlist in v1).
  const [saved, setSaved] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const quickAdd = useMutation({
    mutationFn: async () => {
      const detail = await api<ProductDetail>(
        `/catalog/products/${encodeURIComponent(product.slug)}`,
      );
      const variants = detail.variants ?? [];
      // Single, in-stock variant → add straight to cart. Otherwise let the
      // shopper choose options on the product page.
      const sole = variants.length === 1 ? variants[0] : null;
      if (sole && sole.stock > 0) {
        await cartApi.add(sole.id, 1);
        return "added" as const;
      }
      return "navigate" as const;
    },
    onSuccess: async (result) => {
      if (result === "added") {
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1600);
      } else {
        void navigate({ to: "/products/$slug", params: { slug: product.slug } });
      }
    },
  });

  return (
    <div className="feature-card group relative flex flex-col overflow-hidden">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block no-underline"
        aria-label={product.name}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {img ? (
            <img
              src={img.url}
              alt={img.alt ?? product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
          {product.is_featured && (
            <Badge className="absolute left-2 top-2 shadow-sm">Featured</Badge>
          )}
        </div>
      </Link>

      {/* Wishlist — sibling of the link so it isn't a nested interactive el. */}
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save for later"}
        onClick={() => setSaved((s) => !s)}
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-border bg-card/85 text-muted-foreground backdrop-blur transition hover:text-foreground"
      >
        <Heart
          size={15}
          className={saved ? "fill-primary text-primary" : ""}
        />
      </button>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </p>
        )}
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="no-underline"
        >
          <h3 className="m-0 mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-1.5">
          <Stars rating={rating} />
          <span className="text-xs text-muted-foreground">
            {rating.toFixed(1)} ({count})
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="m-0 text-base font-extrabold text-primary">
            {formatKES(product.base_price_kes)}
          </p>
          <button
            type="button"
            onClick={() => quickAdd.mutate()}
            disabled={quickAdd.isPending}
            aria-label={`Add ${product.name} to cart`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {quickAdd.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : justAdded ? (
              <Check size={15} />
            ) : (
              <Plus size={15} />
            )}
            {justAdded ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
