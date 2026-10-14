import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { cartApi, cartQueries } from "@/lib/cart-api";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKES } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(cartQueries.cart());
  },
  pendingComponent: PendingCart,
  component: CartPage,
});

function CartPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: cartOrNull } = useSuspenseQuery(cartQueries.cart());
  const cart = cartOrNull ?? { id: 0, items: [], subtotal: "0.00", total_weight_kg: "0", item_count: 0 };

  const updateQty = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) =>
      cartApi.updateQty(id, qty),
    onSuccess: async (next) => {
      queryClient.setQueryData(cartQueries.cart().queryKey, next);
      await queryClient.invalidateQueries({ queryKey: cartQueries.cart().queryKey });
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => cartApi.remove(id),
    onSuccess: async (next) => {
      queryClient.setQueryData(cartQueries.cart().queryKey, next);
      await queryClient.invalidateQueries({ queryKey: cartQueries.cart().queryKey });
    },
  });

  if (cart.items.length === 0) {
    return (
      <main className="page-wrap px-4 pb-10 pt-10">
        <header className="mb-6">
          <p className="island-kicker mb-1">Cart</p>
          <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">
            Your cart is empty
          </h1>
        </header>
        <Link to="/products" className="text-sm text-[var(--lagoon-deep)] underline">
          Browse the catalogue →
        </Link>
      </main>
    );
  }

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-1">Cart</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">
          {cart.item_count} item{cart.item_count > 1 ? "s" : ""}
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ul className="m-0 list-none space-y-3 p-0">
          {cart.items.map((item) => (
            <li key={item.id}>
              <Card className="island-shell">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/products/$slug"
                      params={{ slug: item.product.slug }}
                      className="m-0 text-sm font-semibold text-[var(--sea-ink)] no-underline hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <p className="m-0 truncate text-xs text-muted-foreground">
                      {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(" · ")}{" "}
                      · SKU {item.sku}
                    </p>
                    <p className="m-0 mt-1 text-sm text-[var(--sea-ink)]">
                      {formatKES(item.unit_price)}{" "}
                      <span className="text-xs text-muted-foreground">each</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updateQty.isPending || item.qty <= 1}
                      onClick={() =>
                        updateQty.mutate({ id: item.id, qty: item.qty - 1 })
                      }
                    >
                      −
                    </Button>
                    <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                      {item.qty}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updateQty.isPending || item.qty >= item.stock}
                      onClick={() =>
                        updateQty.mutate({ id: item.id, qty: item.qty + 1 })
                      }
                    >
                      +
                    </Button>
                  </div>
                  <div className="hidden min-w-[6rem] text-right text-sm font-semibold sm:block">
                    {formatKES(item.line_total)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(item.id)}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <aside>
          <Card className="island-shell sticky top-24">
            <CardContent className="space-y-3 p-5">
              <p className="island-kicker">Summary</p>
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">{formatKES(cart.subtotal)}</span>
              </div>
              <p className="m-0 text-xs text-muted-foreground">
                Shipping & taxes calculated at checkout.
              </p>
              <Separator />
              <Button
                className="w-full"
                onClick={() => void navigate({ to: "/checkout" })}
              >
                Continue to checkout
              </Button>
              {(updateQty.error || remove.error) && (
                <p className="m-0 text-xs text-red-600">
                  {(updateQty.error || remove.error) instanceof ApiError
                    ? (updateQty.error || remove.error)!.message
                    : "Couldn't update cart."}
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function PendingCart() {
  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <Skeleton className="mb-6 h-9 w-64" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-44 rounded-xl" />
      </div>
    </main>
  );
}
