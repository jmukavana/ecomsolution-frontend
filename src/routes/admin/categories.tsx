import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { adminQueries } from "@/server/admin";
import type { AdminCategory, CategoryInput } from "@/lib/admin-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/admin/categories")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(adminQueries.categories()),
      context.queryClient.ensureQueryData(adminQueries.attributeSets()),
    ]);
  },
  component: AdminCategories,
});

const EMPTY: CategoryInput = {
  slug: "",
  name: "",
  parent_id: null,
  position: 0,
  image: null,
  attribute_set_id: null,
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories } = useSuspenseQuery(adminQueries.categories());
  const { data: attributeSets } = useSuspenseQuery(adminQueries.attributeSets());

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryInput>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);

  const cats = categories ?? [];
  const sets = attributeSets ?? [];

  const set = <K extends keyof CategoryInput>(k: K, v: CategoryInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setSlugTouched(false);
  };

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });

  const save = useMutation({
    mutationFn: (payload: CategoryInput) =>
      editingId === null
        ? adminApi.createCategory(payload)
        : adminApi.updateCategory(editingId, payload),
    onSuccess: async () => {
      await refresh();
      reset();
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: refresh,
  });

  const startEdit = (c: AdminCategory) => {
    setEditingId(c.id);
    setSlugTouched(true);
    setForm({
      slug: c.slug,
      name: c.name,
      parent_id: c.parent_id,
      position: c.position,
      image: c.image,
      attribute_set_id: c.attribute_set_id,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setName = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: slugTouched ? f.slug : slugify(name),
    }));
  };

  const byParent = new Map<number | null, AdminCategory[]>();
  for (const c of cats) {
    const arr = byParent.get(c.parent_id) ?? [];
    arr.push(c);
    byParent.set(c.parent_id, arr);
  }
  const attrSetName = (id: number | null) =>
    sets.find((s) => s.id === id)?.name ?? null;

  const renderRows = (parentId: number | null, depth: number): React.ReactNode[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.position - b.position || a.id - b.id)
      .flatMap((c) => [
        <li key={c.id}>
          <Card className="island-shell">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0" style={{ paddingLeft: depth * 18 }}>
                <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                  {depth > 0 && <span className="text-muted-foreground">↳ </span>}
                  {c.name}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    /{c.slug}
                  </span>
                </p>
                <p className="m-0 mt-0.5 text-xs text-muted-foreground">
                  position {c.position}
                  {c.attribute_set_id != null && (
                    <Badge variant="secondary" className="ml-2">
                      {attrSetName(c.attribute_set_id) ?? `set #${c.attribute_set_id}`}
                    </Badge>
                  )}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => startEdit(c)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete category "${c.name}"?`)) remove.mutate(c.id);
                  }}
                  disabled={remove.isPending}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>,
        ...renderRows(c.id, depth + 1),
      ]);

  // Editing a category must not let it pick itself (or, simply, exclude self) as parent.
  const parentOptions = cats.filter((c) => c.id !== editingId);
  const canSave = form.name.trim() && form.slug.trim();
  const saveError =
    save.error instanceof ApiError ? save.error.message : save.error ? "Couldn't save." : null;

  return (
    <div className="space-y-5">
      <header>
        <p className="island-kicker mb-1">Admin</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">
          Categories
        </h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Build the category tree and attach an attribute set to each branch.
        </p>
      </header>

      <Card className="island-shell">
        <CardContent className="space-y-4 p-5">
          <p className="m-0 text-base font-semibold text-[var(--sea-ink)]">
            {editingId === null ? "New category" : "Edit category"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name" className="mb-1.5 block">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input id="name" value={form.name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="slug" className="mb-1.5 block">
                Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="parent" className="mb-1.5 block">
                Parent
              </Label>
              <select
                id="parent"
                value={form.parent_id ?? ""}
                onChange={(e) =>
                  set("parent_id", e.target.value ? Number(e.target.value) : null)
                }
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">— Top level —</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="attrset" className="mb-1.5 block">
                Attribute set
              </Label>
              <select
                id="attrset"
                value={form.attribute_set_id ?? ""}
                onChange={(e) =>
                  set(
                    "attribute_set_id",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">— None —</option>
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="position" className="mb-1.5 block">
                Position
              </Label>
              <Input
                id="position"
                type="number"
                value={String(form.position ?? 0)}
                onChange={(e) => set("position", Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="image" className="mb-1.5 block">
                Image URL
              </Label>
              <Input
                id="image"
                value={form.image ?? ""}
                onChange={(e) => set("image", e.target.value || null)}
              />
            </div>
          </div>
          {saveError && <p className="m-0 text-sm text-red-600">{saveError}</p>}
          <div className="flex gap-2">
            <Button onClick={() => save.mutate(form)} disabled={!canSave || save.isPending}>
              {save.isPending ? "Saving…" : editingId === null ? "Add category" : "Save changes"}
            </Button>
            {editingId !== null && (
              <Button variant="ghost" onClick={reset} disabled={save.isPending}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {cats.length === 0 ? (
        <div className="island-shell rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No categories yet. Add your first one above.
        </div>
      ) : (
        <ul className="m-0 list-none space-y-2 p-0">{renderRows(null, 0)}</ul>
      )}
    </div>
  );
}
