import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { authQueries } from "@/server/auth";

export const Route = createFileRoute("/account")({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(authQueries.me());
    if (!me) {
      throw redirect({
        to: "/login",
        search: { next: location.pathname },
      });
    }
  },
  component: () => <Outlet />,
});
