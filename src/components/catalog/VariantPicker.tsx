import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatKES } from "@/lib/format";
import { cartApi, cartQueries } from "@/lib/cart-api";
import { ApiError } from "@/lib/api";
import type { ProductVariant } from "@/lib/catalog-types";

interface VariantPickerProps {
  variants: ProductVariant[];
}

/**
 * Renders one toggle row per option key (size, color, storage…),
 * disabling combinations that don't exist or have zero stock.
 */
export function VariantPicker({ variants }: VariantPickerProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const addToCart = useMutation({
    mutationFn: ({ variant_id, qty }: { variant_id: number; qty: number }) =>
      cartApi.add(variant_id, qty),
    onSuccess: async (next) => {
      queryClient.setQueryData(cartQueries.cart().queryKey, next);
      await queryClient.invalidateQueries({ queryKey: cartQueries.cart().queryKey });
    },
  });
  const optionKeys = useMemo(() => {
    const seen = new Set<string>();
    for (const v of variants) Object.keys(v.option_values).forEach((k) => seen.add(k));
    return Array.from(seen);
  }, [variants]);

  const optionValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const k of optionKeys) {
      const set = new Set<string>();
      for (const v of variants) {
        const value = v.option_values[k];
        if (value != null) set.add(String(value));
      }
      map[k] = Array.from(set);
    }
    return map;
  }, [variants, optionKeys]);

  const [selection, setSelection] = useState<Record<string, string>>(() => {
    if (variants.length === 0) return {};
    const init: Record<string, string> = {};
    const first = variants[0];
    for (const k of optionKeys) {
      const v = first.option_values[k];
      if (v != null) init[k] = String(v);
    }
    return init;
  });

  const matched = useMemo(() => {
    return variants.find((v) =>
      optionKeys.every((k) => String(v.option_values[k] ?? "") === (selection[k] ?? "")),
    );
  }, [variants, optionKeys, selection]);

  if (variants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No variants configured.</p>
    );
  }

  const isAvailable = (k: string, value: string) => {
    return variants.some((v) => {
      const matchesOthers = optionKeys.every((kk) =>
        kk === k ? true : String(v.option_values[kk] ?? "") === (selection[kk] ?? ""),
      );
      return matchesOthers && String(v.option_values[k] ?? "") === value && v.stock > 0;
    });
  };

  return (
    <div className="space-y-4">
      {optionKeys.map((k) => (
        <div key={k}>
          <p className="island-kicker mb-2">{k}</p>
          <div className="flex flex-wrap gap-2">
            {optionValues[k].map((value) => {
              const available = isAvailable(k, value);
              const selected = selection[k] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelection((s) => ({ ...s, [k]: value }))}
                  className={`min-w-[3rem] rounded-md border px-3 py-1.5 text-sm capitalize transition ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-accent"
                  } ${available ? "" : "opacity-50 line-through"}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-end justify-between gap-3 pt-3">
        <div>
          {matched ? (
            <>
              <p className="m-0 text-2xl font-bold text-[var(--sea-ink)]">
                {formatKES(matched.price_kes)}
              </p>
              <p className="m-0 text-xs text-muted-foreground">
                SKU {matched.sku} ·{" "}
                {matched.stock > 0
                  ? `${matched.stock} in stock`
                  : "Out of stock"}
              </p>
            </>
          ) : (
            <Badge variant="destructive">Unavailable combination</Badge>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            disabled={!matched || matched.stock === 0 || addToCart.isPending}
            onClick={() => {
              if (matched) addToCart.mutate({ variant_id: matched.id, qty: 1 });
            }}
          >
            {addToCart.isPending ? "Adding…" : "Add to cart"}
          </Button>
          {addToCart.isSuccess && (
            <button
              type="button"
              onClick={() => void navigate({ to: "/cart" })}
              className="text-xs text-[var(--lagoon-deep)] underline"
            >
              Added — view cart →
            </button>
          )}
          {addToCart.error && (
            <p className="m-0 text-xs text-red-600">
              {addToCart.error instanceof ApiError
                ? addToCart.error.message
                : "Couldn't add."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
