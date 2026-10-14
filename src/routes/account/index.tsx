import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { authQueries } from "@/server/auth";
import { meApi, meQueries } from "@/lib/me-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/account/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(authQueries.me()),
      context.queryClient.ensureQueryData(meQueries.unreadCount()),
    ]);
  },
  component: AccountHome,
});

const SECTIONS = [
  {
    to: "/account/orders" as const,
    kicker: "Orders",
    title: "Order history",
    desc: "Track orders and check delivery status.",
  },
  {
    to: "/account/notifications" as const,
    kicker: "Inbox",
    title: "Notifications",
    desc: "Order updates and account alerts.",
  },
  {
    to: "/account/addresses" as const,
    kicker: "Delivery",
    title: "Addresses",
    desc: "Manage saved delivery addresses.",
  },
  {
    to: "/account/security/mfa" as const,
    kicker: "Security",
    title: "Two-factor authentication",
    desc: "Add an extra layer of protection.",
  },
  {
    to: "/account/security/sessions" as const,
    kicker: "Security",
    title: "Active sessions",
    desc: "See where you're signed in and revoke devices.",
  },
];

function AccountHome() {
  const { data: me } = useSuspenseQuery(authQueries.me());
  const { data: unread } = useSuspenseQuery(meQueries.unreadCount());

  if (!me) return null;
  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-1">My account</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          {me.full_name ?? me.email}
        </h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          {me.email}
          {me.role === "admin" && (
            <Badge variant="default" className="ml-2">
              Admin
            </Badge>
          )}
        </p>
      </header>

      <ProfileCard
        initialName={me.full_name ?? ""}
        initialPhone={me.phone ?? ""}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.to} to={s.to} className="block no-underline">
            <Card className="island-shell feature-card">
              <CardContent className="space-y-1 p-5">
                <p className="island-kicker">{s.kicker}</p>
                <p className="m-0 text-base font-semibold text-[var(--sea-ink)]">
                  {s.title}
                  {s.to === "/account/notifications" &&
                    (unread?.unread ?? 0) > 0 && (
                      <Badge variant="default" className="ml-2">
                        {unread!.unread}
                      </Badge>
                    )}
                </p>
                <p className="m-0 text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

function ProfileCard({
  initialName,
  initialPhone,
}: {
  initialName: string;
  initialPhone: string;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(initialName);
    setPhone(initialPhone);
  }, [initialName, initialPhone]);

  const save = useMutation({
    mutationFn: () =>
      meApi.updateProfile({
        full_name: name.trim() || null,
        phone: phone.trim() || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: authQueries.me().queryKey,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const dirty = name !== initialName || phone !== initialPhone;

  return (
    <Card className="island-shell">
      <CardContent className="space-y-4 p-5">
        <p className="m-0 text-base font-semibold text-[var(--sea-ink)]">
          Profile
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="full_name" className="mb-1.5 block">
              Full name
            </Label>
            <Input
              id="full_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="phone" className="mb-1.5 block">
              Phone
            </Label>
            <Input
              id="phone"
              placeholder="07XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => save.mutate()}
            disabled={!dirty || save.isPending}
          >
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
          {saved && (
            <span className="text-sm text-muted-foreground">Saved.</span>
          )}
          {save.error && (
            <span className="text-sm text-red-600">Couldn't save.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
