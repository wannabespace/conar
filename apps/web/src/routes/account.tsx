import type { LinkProps } from '@tanstack/react-router'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { ThemeToggle } from '@conar/ui/components/custom/theme-toggle'
import { Separator } from '@conar/ui/components/separator'
import { cn } from '@conar/ui/lib/utils'
import { RiDashboard3Line, RiFileListLine, RiLogoutCircleLine, RiMoonLine, RiSunLine } from '@remixicon/react'
import { createFileRoute, Link, Outlet, redirect, useMatches, useRouter } from '@tanstack/react-router'
import { Footer } from '~/components/footer'
import { NavbarTextLogo } from '~/components/navbar-text-logo'
import { authClient, getSessionIsomorphic } from '~/lib/auth'

export const Route = createFileRoute('/account')({
  component: AccountLayout,
  loader: async () => {
    const { data } = await getSessionIsomorphic()

    if (!data?.user) {
      throw redirect({ to: '/' })
    }

    return data
  },
})

function SidebarLink({ active, ...props }: LinkProps & { active: boolean }) {
  return (
    <Button
      variant="ghost"
      asChild
    >
      <Link
        {...props}
        className={cn(
          `w-full justify-start`,
          active && `bg-accent/50`,
        )}
      />
    </Button>
  )
}

function AccountLayout() {
  const router = useRouter()
  const match = useMatches({
    select: matches => matches.map(match => match.routeId).at(-1),
  })
  const { user } = Route.useLoaderData()

  return (
    <div className={`
      container mx-auto flex min-h-screen flex-col justify-between px-4
    `}
    >
      <header className="mb-10 flex h-15 items-center justify-between">
        <NavbarTextLogo to="/home" />
        <div className="flex flex-1 justify-center">
          <Link to="/home" className="text-primary">
            <AppLogo
              className={`
                size-5
                sm:size-6
                lg:size-8
              `}
            />
          </Link>
        </div>
        <div className={`
          flex flex-1 items-center justify-end gap-1
          sm:gap-2
        `}
        >
          <ThemeToggle side="bottom">
            <Button size="icon-sm" variant="ghost">
              <RiSunLine className={`
                size-4
                dark:hidden
              `}
              />
              <RiMoonLine className={`
                hidden size-4
                dark:block
              `}
              />
            </Button>
          </ThemeToggle>
          <Button
            variant="outline"
            disabled
            size="sm"
          >
            Web version (soon)
          </Button>
          <Button
            size="sm"
            className={`
              gap-1 px-2 text-xs
              sm:gap-2 sm:px-3 sm:text-sm
            `}
            asChild
          >
            <Link to="/download">
              Download
            </Link>
          </Button>
        </div>
      </header>
      <div className="mb-10 flex flex-1 gap-6">
        <aside className="w-64 shrink-0">
          <div className="mb-4 flex flex-col">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <nav className="space-y-1">
            <SidebarLink to="/account" active={match === '/account/'}>
              <RiDashboard3Line className="size-4" />
              Dashboard
            </SidebarLink>
            {/* <SidebarLink to="/account/settings" active={match === '/_account/account/settings'}>
              <RiSettingsLine className="size-4" />
              Settings
            </SidebarLink> */}
            <SidebarLink to="/account/billing" active={match === '/account/billing'}>
              <RiFileListLine className="size-4" />
              Billing & Invoices
            </SidebarLink>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground"
              onClick={() => authClient.signOut().then(() => router.invalidate())}
            >
              <RiLogoutCircleLine className="size-4" />
              Sign out
            </Button>
          </nav>
        </aside>
        <Separator orientation="vertical" />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
