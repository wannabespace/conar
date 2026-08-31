import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { cn } from '@tamery/ui/lib/utils'

export const titleBarClassName =
  'flex h-[calc(40px+1px)] shrink-0 items-center border-b border-transparent'

export const AppShell = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 flex flex-col"
    data-shell
    id="shell-app"
  >
    <div
      className={cn(titleBarClassName, 'border-b-border bg-card gap-1.5')}
      id="shell-titlebar"
    >
      <div className="flex w-full items-center px-2">
        <div className="shrink-0 p-1.5">
          <AppLogo className="text-primary size-4" />
        </div>
      </div>
    </div>
  </div>
)

export const AuthShell = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 grid lg:grid-cols-2"
    data-shell
    id="shell-auth"
  >
    <div className="bg-body border-r-border hidden border-r lg:block" />
  </div>
)
