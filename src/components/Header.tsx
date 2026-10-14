import { useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DropdownMenu } from 'radix-ui'
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Search,
  ShoppingBag,
  User,
  type LucideIcon,
} from 'lucide-react'

import ThemeToggle from './ThemeToggle'
import { authApi } from '@/lib/auth-api'
import type { Me } from '@/lib/auth-types'
import { authQueries } from '@/server/auth'
import { cartQueries } from '@/lib/cart-api'
import { meQueries } from '@/lib/me-api'

function SearchBar() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        void navigate({
          to: '/products',
          search: q.trim() ? { q: q.trim() } : {},
        })
      }}
      className="relative flex w-full items-center"
    >
      <Search
        size={16}
        className="pointer-events-none absolute left-3 text-muted-foreground"
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products…"
        aria-label="Search products"
        className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
      />
    </form>
  )
}

function IconButton({
  to,
  label,
  count,
  children,
}: {
  to: '/cart' | '/account/notifications'
  label: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      aria-label={count ? `${label}, ${count}` : label}
      className="relative inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      {children}
      {count != null && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

export default function Header() {
  const { data: me } = useQuery(authQueries.me())
  const { data: cart } = useQuery({ ...cartQueries.cart(), retry: false })
  const cartCount = cart?.item_count ?? 0
  const { data: unread } = useQuery({
    ...meQueries.unreadCount(),
    enabled: !!me,
    retry: false,
    refetchInterval: 60_000,
  })
  const unreadCount = me ? (unread?.unread ?? 0) : 0
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()
  const logout = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      queryClient.setQueryData(authQueries.me().queryKey, null)
      await router.invalidate()
      void navigate({ to: '/' })
    },
  })

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[var(--header-bg)] backdrop-blur-lg">
      <div className="page-wrap flex flex-wrap items-center gap-x-4 gap-y-3 py-3">
        <Link
          to="/"
          className="flex flex-shrink-0 items-center gap-2 text-base font-extrabold tracking-tight text-foreground no-underline"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
            E
          </span>
          <span className="hidden sm:inline">Ecomsolution</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/products"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Shop
          </Link>
        </nav>

        <div className="order-last w-full md:order-none md:mx-auto md:w-auto md:max-w-md md:flex-1">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <IconButton to="/cart" label="Cart" count={cartCount}>
            <ShoppingBag size={20} />
          </IconButton>

          {me ? (
            <>
              <IconButton
                to="/account/notifications"
                label="Notifications"
                count={unreadCount}
              >
                <Bell size={20} />
              </IconButton>
              <AccountMenu
                me={me}
                loggingOut={logout.isPending}
                onLogout={() => logout.mutate()}
              />
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground no-underline transition hover:opacity-90"
            >
              Sign in
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

function AccountMenu({
  me,
  onLogout,
  loggingOut,
}: {
  me: Me
  onLogout: () => void
  loggingOut: boolean
}) {
  const initial = (me.full_name?.trim()?.[0] ?? me.email[0]).toUpperCase()
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-2 text-sm font-semibold text-foreground transition hover:bg-accent data-[state=open]:bg-accent"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initial}
          </span>
          <span className="hidden max-w-[10ch] truncate sm:inline">
            {me.full_name ?? me.email}
          </span>
          <ChevronDown size={15} className="text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[14rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <div className="px-2 py-2">
            <p className="m-0 truncate text-sm font-semibold text-foreground">
              {me.full_name ?? 'Your account'}
            </p>
            <p className="m-0 truncate text-xs text-muted-foreground">
              {me.email}
            </p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <MenuLink to="/account" icon={User}>
            My account
          </MenuLink>
          <MenuLink to="/account/orders" icon={Package}>
            Orders
          </MenuLink>
          <MenuLink to="/account/notifications" icon={Bell}>
            Notifications
          </MenuLink>
          <MenuLink to="/account/addresses" icon={MapPin}>
            Addresses
          </MenuLink>
          {me.role === 'admin' && (
            <MenuLink to="/admin" icon={LayoutDashboard}>
              Admin dashboard
            </MenuLink>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            disabled={loggingOut}
            onSelect={(e) => {
              e.preventDefault()
              onLogout()
            }}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground outline-none transition focus:bg-accent disabled:opacity-50"
          >
            <LogOut size={16} className="text-muted-foreground" />
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function MenuLink({
  to,
  icon: Icon,
  children,
}: {
  to: '/account' | '/account/orders' | '/account/notifications' | '/account/addresses' | '/admin'
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        to={to}
        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground no-underline outline-none transition focus:bg-accent"
      >
        <Icon size={16} className="text-muted-foreground" />
        {children}
      </Link>
    </DropdownMenu.Item>
  )
}
