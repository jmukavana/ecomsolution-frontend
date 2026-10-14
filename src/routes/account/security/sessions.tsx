import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { authApi } from "@/lib/auth-api";
import { meQueries } from "@/lib/me-api";
import type { SessionRow } from "@/lib/auth-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/account/security/sessions")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(meQueries.sessions());
  },
  component: SessionsPage,
});

function SessionsPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(meQueries.sessions());
  const sessions = data ?? [];

  const revoke = useMutation({
    mutationFn: (id: number) => authApi.revokeSession(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meQueries.sessions().queryKey });
    },
  });

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-1">Security</p>
        <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          Active sessions
        </h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Sign out of any device that you don't recognise.
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="island-shell rounded-2xl p-6 text-sm text-muted-foreground">
          No active sessions.
        </div>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {sessions.map((s: SessionRow) => (
            <li key={s.id}>
              <Card className="island-shell">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-sm font-semibold">
                      {s.user_agent ?? "Unknown device"}
                      {s.current && (
                        <Badge variant="default" className="ml-2">
                          This device
                        </Badge>
                      )}
                    </p>
                    <p className="m-0 text-xs text-muted-foreground">
                      IP {s.ip ?? "—"} · last seen{" "}
                      {s.last_seen_at
                        ? new Date(s.last_seen_at).toLocaleString()
                        : "—"}{" "}
                      · expires {new Date(s.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!s.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revoke.mutate(s.id)}
                      disabled={revoke.isPending}
                    >
                      Sign out
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
