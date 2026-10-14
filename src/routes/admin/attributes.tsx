import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { adminQueries } from "@/server/admin";
import type {
  AttributeDataType,
  AttributeDefinition,
  AttributeSet,
  AttributeSetInput,
} from "@/lib/admin-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/admin/attributes")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(adminQueries.attributeSets());
  },
  component: AdminAttributes,
});

const DATA_TYPES: AttributeDataType[] = [
  "text",
  "number",
  "boolean",
  "enum",
  "date",
];

/** Editor-local shape: enum options held as a single comma-separated string. */
interface DefDraft {
  key: string;
  label: string;
  data_type: AttributeDataType;
  unit: string;
  options: string;
  is_required: boolean;
  is_filterable: boolean;
}

const NEW_DEF: DefDraft = {
  key: "",
  label: "",
  data_type: "text",
  unit: "",
  options: "",
  is_required: false,
  is_filterable: false,
};

function toDraft(d: AttributeDefinition): DefDraft {
  return {
    key: d.key,
    label: d.label,
    data_type: d.data_type,
    unit: d.unit ?? "",
    options: (d.options ?? []).join(", "),
    is_required: d.is_required,
    is_filterable: d.is_filterable,
  };
}

function toPayload(name: string, defs: DefDraft[]): AttributeSetInput {
  return {
    name: name.trim(),
    attributes: defs.map((d, i) => ({
      key: d.key.trim(),
      label: d.label.trim(),
      data_type: d.data_type,
      unit: d.unit.trim() || null,
      options:
        d.data_type === "enum"
          ? d.options
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean)
          : null,
      is_required: d.is_required,
      is_filterable: d.is_filterable,
      position: i,
    })),
  };
}

function AdminAttributes() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(adminQueries.attributeSets());
  const sets = data ?? [];

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [defs, setDefs] = useState<DefDraft[]>([]);
  const [creating, setCreating] = useState(false);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "attribute-sets"] });

  const reset = () => {
    setEditingId(null);
    setCreating(false);
    setName("");
    setDefs([]);
  };

  const save = useMutation({
    mutationFn: (payload: AttributeSetInput) =>
      editingId === null
        ? adminApi.createAttributeSet(payload)
        : adminApi.updateAttributeSet(editingId, payload),
    onSuccess: async () => {
      await refresh();
      reset();
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.deleteAttributeSet(id),
    onSuccess: refresh,
  });

  const startNew = () => {
    setEditingId(null);
    setCreating(true);
    setName("");
    setDefs([{ ...NEW_DEF }]);
  };

  const startEdit = (s: AttributeSet) => {
    setEditingId(s.id);
    setCreating(false);
    setName(s.name);
    setDefs(s.attributes.map(toDraft));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateDef = (i: number, patch: Partial<DefDraft>) =>
    setDefs((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const addDef = () => setDefs((ds) => [...ds, { ...NEW_DEF }]);
  const removeDef = (i: number) =>
    setDefs((ds) => ds.filter((_, idx) => idx !== i));

  const editorOpen = creating || editingId !== null;
  const canSave =
    name.trim() &&
    defs.length > 0 &&
    defs.every((d) => d.key.trim() && d.label.trim());
  const saveError =
    save.error instanceof ApiError
      ? save.error.message
      : save.error
        ? "Couldn't save."
        : null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="island-kicker mb-1">Admin</p>
          <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">
            Attribute sets
          </h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            Define the fields each category's products must fill in.
          </p>
        </div>
        {!editorOpen && (
          <Button size="sm" onClick={startNew}>
            New attribute set
          </Button>
        )}
      </header>

      {editorOpen && (
        <Card className="island-shell">
          <CardContent className="space-y-4 p-5">
            <p className="m-0 text-base font-semibold text-[var(--sea-ink)]">
              {editingId === null ? "New attribute set" : "Edit attribute set"}
            </p>
            <div className="max-w-sm">
              <Label htmlFor="set-name" className="mb-1.5 block">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="set-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electronics"
              />
            </div>

            <div className="space-y-3">
              <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                Attributes
              </p>
              {defs.map((d, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--line)] p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <LabeledInput
                      label="Key"
                      value={d.key}
                      onChange={(v) => updateDef(i, { key: v })}
                      placeholder="warranty_months"
                    />
                    <LabeledInput
                      label="Label"
                      value={d.label}
                      onChange={(v) => updateDef(i, { label: v })}
                      placeholder="Warranty"
                    />
                    <div>
                      <Label className="mb-1.5 block">Type</Label>
                      <select
                        value={d.data_type}
                        onChange={(e) =>
                          updateDef(i, {
                            data_type: e.target.value as AttributeDataType,
                          })
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm capitalize"
                      >
                        {DATA_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <LabeledInput
                      label="Unit"
                      value={d.unit}
                      onChange={(v) => updateDef(i, { unit: v })}
                      placeholder="months, GB, cm…"
                    />
                  </div>

                  {d.data_type === "enum" && (
                    <div className="mt-3">
                      <LabeledInput
                        label="Options (comma-separated)"
                        value={d.options}
                        onChange={(v) => updateDef(i, { options: v })}
                        placeholder="new, refurbished, used"
                      />
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={d.is_required}
                        onChange={(e) =>
                          updateDef(i, { is_required: e.target.checked })
                        }
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={d.is_filterable}
                        onChange={(e) =>
                          updateDef(i, { is_filterable: e.target.checked })
                        }
                      />
                      Filterable
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => removeDef(i)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addDef}>
                + Add attribute
              </Button>
            </div>

            {saveError && <p className="m-0 text-sm text-red-600">{saveError}</p>}
            <div className="flex gap-2">
              <Button
                onClick={() => save.mutate(toPayload(name, defs))}
                disabled={!canSave || save.isPending}
              >
                {save.isPending
                  ? "Saving…"
                  : editingId === null
                    ? "Create set"
                    : "Save changes"}
              </Button>
              <Button variant="ghost" onClick={reset} disabled={save.isPending}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sets.length === 0 && !editorOpen ? (
        <div className="island-shell rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No attribute sets yet. Create one to describe a product family.
        </div>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {sets.map((s) => (
            <li key={s.id}>
              <Card className="island-shell">
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                      {s.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {s.attributes.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          No attributes
                        </span>
                      )}
                      {s.attributes.map((a) => (
                        <Badge key={a.key} variant="secondary">
                          {a.label}
                          <span className="ml-1 opacity-60">({a.data_type})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete attribute set "${s.name}"?`))
                          remove.mutate(s.id);
                      }}
                      disabled={remove.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
