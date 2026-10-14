import { Link } from '@tanstack/react-router'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="page-wrap grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground no-underline"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
              E
            </span>
            Ecomsolution
          </Link>
          <p className="m-0 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Quality electronics and everyday essentials, delivered across Kenya.
            Pay securely with M-Pesa or cash on delivery.
          </p>
        </div>

        <FooterCol title="Shop">
          <FooterLink to="/products">All products</FooterLink>
          <FooterLink to="/cart">Your cart</FooterLink>
          <FooterLink to="/account/orders">Order history</FooterLink>
        </FooterCol>

        <FooterCol title="Account">
          <FooterLink to="/account">My account</FooterLink>
          <FooterLink to="/account/addresses">Addresses</FooterLink>
          <FooterLink to="/account/security/sessions">Security</FooterLink>
        </FooterCol>

        <FooterCol title="Payments & delivery">
          <li className="text-sm text-muted-foreground">M-Pesa STK Push</li>
          <li className="text-sm text-muted-foreground">Cash on delivery</li>
          <li className="text-sm text-muted-foreground">Delivery to all 47 counties</li>
        </FooterCol>
      </div>

      <div className="border-t border-border">
        <div className="page-wrap flex flex-col items-center justify-between gap-2 py-5 text-center sm:flex-row sm:text-left">
          <p className="m-0 text-xs text-muted-foreground">
            &copy; {year} Ecomsolution. All rights reserved.
          </p>
          <p className="m-0 text-xs text-muted-foreground">Prices in KES · VAT included</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-bold tracking-tight text-foreground">
        {title}
      </p>
      <ul className="m-0 list-none space-y-2 p-0">{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="text-sm text-muted-foreground no-underline transition hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  )
}
