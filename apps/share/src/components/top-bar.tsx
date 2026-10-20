import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Button } from '@tamery/ui/components/button'
import { Link, useLocation, useRouteContext } from '@tanstack/react-router'

export const TopBar = () => {
  const { viewer } = useRouteContext({ from: '__root__' })
  const here = useLocation({ select: (location) => location.href })

  return (
    <nav className="flex h-8 shrink-0 items-center justify-between px-3">
      <a
        href={import.meta.env.VITE_PUBLIC_MAIN_URL}
        aria-label="Tamery"
        className="text-foreground rounded-md p-1"
      >
        <AppLogo className="text-primary size-5" />
      </a>
      {viewer ? (
        here !== '/' && (
          <Button size="sm" variant="ghost-muted" render={<Link to="/" />}>
            Your shares
          </Button>
        )
      ) : (
        <Button
          size="sm"
          variant="outline"
          render={
            <a
              href={`${import.meta.env.VITE_PUBLIC_MAIN_URL}/deep/share?${new URLSearchParams({ path: here })}`}
              aria-label="Sign in"
            />
          }
        >
          Sign in
        </Button>
      )}
    </nav>
  )
}
