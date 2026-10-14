import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { meApi, meQueries } from "@/lib/me-api";
import type { Address, AddressInput } from "@/lib/me-types";
import { KENYAN_COUNTIES } from "@/lib/counties";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/account/addresses")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(meQueries.addresses());
  },
  component: AddressesPage,
});

const EMPTY: AddressInput = {
  county: "Nairobi",
  town: "",
  street: "",
  landmark: "",
  phone: "",
  is_default: false,
};

function AddressesPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(meQueries.addresses());
  const addresses = data ?? [];

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [open, setOpen] = useState(false);

  const set = (k: keyof AddressInput, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: meQueries.addresses().queryKey });

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setOpen(false);
  };

  const save = useMutation({
    mutationFn: (payload: AddressInput) =>
      editingId === null
        ? meApi.createAddress(payload)
        : meApi.updateAddress(editingId, payload),
    onSuccess: async () => {
      await refresh();
      reset();
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => meApi.deleteAddress(id),
    onSuccess: refresh,
  });

  const makeDefault = useMutation({
    mutationFn: (a: Address) =>
      meApi.updateAddress(a.id, {
        county: a.county,
        town: a.town,
        street: a.street,
        landmark: a.landmark,
        phone: a.phone,
        is_default: true,
      }),
    onSuccess: refresh,
  });

  const startEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({
      county: a.county,
      town: a.town,
      street: a.street ?? "",
      landmark: a.landmark ?? "",
      phone: a.phone,
      is_default: a.is_default,
    });
    setOpen(true);
  };

  const canSave = form.town.trim() && form.phone.trim() && form.county;

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="island-kicker mb-1">My account</p>
          <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
            Delivery addresses
          </h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            Save where you want orders delivered.
          </p>
        </div>
        {!open && (
          <Button size="sm" onClick={() => setOpen(true)}>
            Add address
          </Button>
        )}
      </header>

      {open && (
        <Card className="island-shell mb-6">
          <CardContent className="space-y-4 p-5">
            <p className="m-0 text-base font-semibold text-[var(--sea-ink)]">
              {editingId === null ? "New address" : "Edit address"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="county" className="mb-1.5 block">
                  County
                </Label>
                <select
                  id="county"
                  value={form.county}
                  onChange={(e) => set("county", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {KENYAN_COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Town / estate"
                required
                value={form.town}
                onChange={(v) => set("town", v)}
              />
              <Field
                label="Street"
                value={form.street ?? ""}
                onChange={(v) => set("street", v)}
              />
              <Field
                label="Landmark"
                value={form.landmark ?? ""}
                onChange={(v) => set("landmark", v)}
              />
              <Field
                label="Phone"
                required
                placeholder="07XX XXX XXX"
                value={form.phone}
                onChange={(v) => set("phone", v)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.is_default ?? false}
                onChange={(e) => set("is_default", e.target.checked)}
              />
              Set as default delivery address
            </label>
            {save.error && (
              <p className="m-0 text-sm text-red-600">
                Couldn't save that address. Check the fields and try again.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => save.mutate(form)}
                disabled={!canSave || save.isPending}
              >
                {save.isPending ? "Saving…" : "Save address"}
              </Button>
              <Button variant="ghost" onClick={reset} disabled={save.isPending}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {addresses.length === 0 && !open && (
        <div className="island-shell rounded-2xl p-8 text-center">
          <p className="m-0 text-base font-semibold text-[var(--sea-ink)]">
            No saved addresses
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add one to speed up checkout next time.
          </p>
        </div>
      )}

      {addresses.length > 0 && (
        <ul className="m-0 list-none space-y-3 p-0">
          {addresses.map((a) => (
            <li key={a.id}>
              <Card className="island-shell">
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                      {a.town}, {a.county}
                      {a.is_default && (
                        <Badge variant="default" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </p>
                    <p className="m-0 mt-1 text-sm text-muted-foreground">
                      {a.street && <>{a.street} · </>}
                      {a.landmark && <>Near {a.landmark} · </>}
                      {a.phone}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-1.5">
                    {!a.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => makeDefault.mutate(a)}
                        disabled={makeDefault.isPending}
                      >
                        Set default
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => startEdit(a)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove.mutate(a.id)}
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
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <Input
        id={id}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
