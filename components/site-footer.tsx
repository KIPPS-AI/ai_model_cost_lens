import Link from 'next/link'
import Image from 'next/image'

const NAV_LINKS = [
  { label: 'Cost Calculator', href: '/' },
  { label: 'Model Pricing', href: '/models' },
  { label: 'Compare Models', href: '/compare' },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Image
                src="/kipps-logo.png"
                alt="Kipps.AI logo"
                width={28}
                height={28}
                className="rounded-md"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-foreground">CostLens</span>
                <span className="text-[10px] text-muted-foreground">By Kipps.AI</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by{' '}
              <a
                href="https://kipps.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                Kipps.AI
              </a>
            </p>
          </div>

          {/* Navigation */}
          <nav
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6"
            aria-label="Footer navigation"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-1 border-t border-border py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Pricing sourced from official provider docs. Verify before budgeting.
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Kipps.AI
          </p>
        </div>
      </div>
    </footer>
  )
}
