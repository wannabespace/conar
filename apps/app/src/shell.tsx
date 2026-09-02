import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { cn } from '@tamery/ui/lib/utils'

export const titleBarClassName =
  'flex h-[calc(40px+1px)] shrink-0 items-center border-b border-transparent'

export const resourcePanelClassName =
  'bg-background flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-lg'

export const centeredPageClassName =
  'mx-auto flex min-h-full w-full max-w-2xl flex-col px-6 py-12'

const ShellFrame = ({
  children,
  id,
}: {
  children: React.ReactNode
  id: string
}) => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 flex flex-col"
    data-shell
    id={id}
  >
    <div
      className={cn(titleBarClassName, 'border-b-border bg-card gap-1.5')}
      data-shell-titlebar
    >
      <div className="flex w-full items-center px-2">
        <div className="shrink-0 p-1.5">
          <AppLogo className="text-primary size-4" />
        </div>
      </div>
    </div>
    {children}
  </div>
)

const ConnectionShell = () => (
  <ShellFrame id="shell-connection">
    <div className="flex min-h-0 flex-1 p-2">
      <div className="h-full shrink-0" data-shell-navigator />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className={resourcePanelClassName}>
          <div className="h-8 shrink-0" />
        </div>
        <div
          className="flex min-h-0 shrink-0 flex-col pt-1.5"
          data-shell-logger
        >
          <div className={resourcePanelClassName}>
            <div className="h-8 shrink-0" />
          </div>
        </div>
      </div>
      <div className="h-full shrink-0" data-shell-chat>
        <div className="flex h-full flex-col pl-1.5">
          <div className={resourcePanelClassName}>
            <div className="h-8 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  </ShellFrame>
)

const DashboardShell = () => (
  <ShellFrame id="shell-dashboard">
    <div className={centeredPageClassName} />
  </ShellFrame>
)

const AuthShell = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 grid lg:grid-cols-2"
    data-shell
    id="shell-auth"
  >
    <div className="bg-body border-r-border hidden border-r lg:block" />
  </div>
)

const StaticTitleBar = () => (
  <div className="fixed inset-x-0 top-0 h-10 [-webkit-app-region:drag]" />
)

export const Shells = () => (
  <>
    <StaticTitleBar />
    <AuthShell />
    <DashboardShell />
    <ConnectionShell />
  </>
)
