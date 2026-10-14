import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CategoryNode, FilterableAttribute } from "@/lib/catalog-types";

interface FilterPanelProps {
  categories: CategoryNode[];
  brands: string[];
  attributes: FilterableAttribute[];
  selected: {
    category: string;
    brand: string;
    q: string;
    minPrice: string;
    maxPrice: string;
  };
  onChange: (next: Partial<FilterPanelProps["selected"]>) => void;
  onReset: () => void;
}

function flattenCategories(nodes: CategoryNode[], depth = 0): Array<CategoryNode & { depth: number }> {
  const out: Array<CategoryNode & { depth: number }> = [];
  for (const n of nodes) {
    out.push({ ...n, depth });
    if (n.children?.length) out.push(...flattenCategories(n.children, depth + 1));
  }
  return out;
}

export function FilterPanel({
  categories,
  brands,
  attributes,
  selected,
  onChange,
  onReset,
}: FilterPanelProps) {
  const flat = flattenCategories(categories);

  return (
    <aside className="island-shell sticky top-24 space-y-5 rounded-2xl p-5 text-sm">
      <div>
        <Label htmlFor="q" className="mb-2 block">Search</Label>
        <Input
          id="q"
          placeholder="Find anything…"
          value={selected.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>

      <Separator />

      <div>
        <p className="island-kicker mb-2">Categories</p>
        <ul className="m-0 list-none space-y-1 p-0">
          <li>
            <button
              type="button"
              onClick={() => onChange({ category: "" })}
              className={`w-full rounded-md px-2 py-1 text-left text-sm transition hover:bg-accent ${
                selected.category === "" ? "bg-accent font-semibold" : ""
              }`}
            >
              All
            </button>
          </li>
          {flat.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange({ category: c.slug })}
                style={{ paddingLeft: `${0.5 + c.depth * 0.75}rem` }}
                className={`w-full rounded-md px-2 py-1 text-left text-sm transition hover:bg-accent ${
                  selected.category === c.slug ? "bg-accent font-semibold" : ""
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {brands.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="island-kicker mb-2">Brand</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ brand: "" })}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                  selected.brand === ""
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:bg-accent"
                }`}
              >
                Any
              </button>
              {brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => onChange({ brand: b })}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                    selected.brand === b
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="min" className="mb-1 block text-xs">Min KSh</Label>
          <Input
            id="min"
            inputMode="numeric"
            value={selected.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="max" className="mb-1 block text-xs">Max KSh</Label>
          <Input
            id="max"
            inputMode="numeric"
            value={selected.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      {attributes.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="island-kicker">Attributes for this category</p>
            <ul className="m-0 list-disc space-y-0.5 pl-4">
              {attributes.map((a) => (
                <li key={a.key}>
                  {a.label}
                  {a.unit ? ` (${a.unit})` : ""}
                  {a.options.length > 0 ? `: ${a.options.join(", ")}` : ""}
                </li>
              ))}
            </ul>
            <p className="text-[10px] italic">
              Attribute-based filtering UI ships in Phase 5.
            </p>
          </div>
        </>
      )}

      <Separator />
      <Button variant="outline" size="sm" onClick={onReset} className="w-full">
        Reset
      </Button>
    </aside>
  );
}
