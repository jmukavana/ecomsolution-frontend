import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { authQueries } from "@/server/auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(authQueries.me());
    if (!me) {
      throw redirect({ to: "/login", search: { next: location.pathname } });
    }
    if (me.role !== "admin") {
      throw redirect({ to: "/" });
    }
    if (me.mfa_required && !me.mfa_passed) {
      throw redirect({
        to: me.has_mfa_factor ? "/login/mfa" : "/account/security/mfa",
      });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="page-wrap px-4 pb-10 pt-8">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <nav className="island-shell sticky top-24 rounded-2xl p-3">
            <p className="island-kicker mb-2 px-2">Admin</p>
            <ul className="m-0 list-none space-y-1 p-0 text-sm">
              <NavItem to="/admin" label="Dashboard" />
              <NavItem to="/admin/orders" label="Orders" />
              <NavItem to="/admin/products" label="Products" />
              <NavItem to="/admin/categories" label="Categories" />
              <NavItem to="/admin/attributes" label="Attribute sets" />
            </ul>
            <div className="mt-4 border-t border-[var(--line)] pt-3 text-xs text-muted-foreground">
              <Link to="/" className="hover:underline">← Back to store</Link>
            </div>
          </nav>
        </aside>
        <section>
          <Outlet />
        </section>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
}: {
  to:
    | "/admin"
    | "/admin/orders"
    | "/admin/products"
    | "/admin/categories"
    | "/admin/attributes";
  label: string;
}) {
  return (
    <li>
      <Link
        to={to}
        className="block rounded-md px-3 py-2 text-sm transition hover:bg-accent"
        activeProps={{ className: "block rounded-md px-3 py-2 text-sm bg-accent font-semibold" }}
        activeOptions={{ exact: to === "/admin" }}
      >
        {label}
      </Link>
    </li>
  );
}
