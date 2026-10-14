import { Link, createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { meApi, meQueries } from "@/lib/me-api";
import type { MyNotification } from "@/lib/me-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/account/notifications")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(meQueries.notifications());
  },
  component: NotificationsPage,
});

function orderIdOf(n: MyNotification): number | null {
  const id = n.payload?.order_id;
  return typeof id === "number" ? id : null;
}

function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(meQueries.notifications());
  const notifications = data ?? [];

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: meQueries.notifications().queryKey }),
      queryClient.invalidateQueries({ queryKey: meQueries.unreadCount().queryKey }),
    ]);
  };

  const markRead = useMutation({
    mutationFn: (id: number) => meApi.markNotificationRead(id),
    onSuccess: invalidate,
  });
  const markAll = useMutation({
    mutationFn: () => meApi.markAllNotificationsRead(),
    onSuccess: invalidate,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="island-kicker mb-1">My account</p>
          <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
            Notifications
          </h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            Order updates and account alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            Mark all read
          </Button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="island-shell rounded-2xl p-8 text-center">
          <p className="m-0 text-base font-semibold text-[var(--sea-ink)]">
            You're all caught up
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Notifications about your orders will appear here.
          </p>
        </div>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {notifications.map((n) => {
            const orderId = orderIdOf(n);
            return (
              <li key={n.id}>
                <Card
                  className={
                    n.is_read
                      ? "island-shell"
                      : "island-shell border-l-4 border-l-[var(--lagoon-deep)]"
                  }
                >
                  <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                        {!n.is_read && (
                          <span
                            className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--lagoon-deep)] align-middle"
                            aria-hidden
                          />
                        )}
                        {n.title ?? "Notification"}
                      </p>
                      <p className="m-0 mt-1 text-sm text-muted-foreground">{n.body}</p>
                      <p className="m-0 mt-1 text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                        {orderId !== null && (
                          <>
                            {" · "}
                            <Link
                              to="/orders/$id"
                              params={{ id: String(orderId) }}
                              className="font-semibold text-[var(--sea-ink)]"
                            >
                              View order #{orderId}
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                    {!n.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead.mutate(n.id)}
                        disabled={markRead.isPending}
                      >
                        Mark read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
