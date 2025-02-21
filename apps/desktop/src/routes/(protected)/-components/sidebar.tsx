import { Separator } from '@connnect/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { cn } from '@connnect/ui/lib/utils'
import { useLocation, useParams, useRouter } from '@tanstack/react-router'
import { AppLogo } from '~/components/app-logo'
import { ConnectionIcon } from '~/components/connection-icon'
import { connectionQuery, useConnections } from '~/entities/connection'
import { queryClient } from '~/main'
import { UserButton } from './user-button'

function SidebarButton({
  children,
  className,
  active = false,
  tooltip,
  onClick,
  onMouseOver,
}: {
  children: React.ReactNode
  className?: string
  active?: boolean
  onClick?: () => void
  onMouseOver?: () => void
  tooltip?: string
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild onMouseOver={onMouseOver} onClick={onClick}>
          <button
            type="button"
            className={cn(
              'flex cursor-pointer items-center bg-element hover:bg-accent rounded-lg duration-150 justify-center size-10',
              active && 'bg-primary/10 hover:bg-primary/20',
              className,
            )}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={20}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function Sidebar() {
  const router = useRouter()
  const params = useParams({ strict: false })
  const location = useLocation()
  const { data: connections } = useConnections()

  return (
    <>
      <div className="w-18" />
      <div className="fixed h-full top-0 left-0 z-50 w-18 duration-150 pt-10 pb-2 px-2">
        <div className="flex flex-col items-center h-full justify-between p-2 bg-background border border-border rounded-xl">
          <div className="flex flex-col gap-2">
            <SidebarButton
              tooltip="Connections"
              className={cn(
                'text-primary',
                // location.pathname === '/' && 'bg-primary/10',
              )}
              active={location.pathname === '/'}
              onClick={() => router.navigate({ to: '/' })}
            >
              <AppLogo className="size-6" />
            </SidebarButton>
            <Separator className="w-full" />
            {connections?.map(connection => (
              <SidebarButton
                key={connection.id}
                tooltip={connection.name}
                active={params.id === connection.id}
                className="rounded-full"
                onMouseOver={() => queryClient.prefetchQuery(connectionQuery(connection.id))}
                onClick={() => router.navigate({ to: '/connections/$id', params: { id: connection.id } })}
              >
                <ConnectionIcon className="size-5" type={connection.type} />
              </SidebarButton>
            ))}
          </div>
          <div className="[app-region:drag] flex-1 w-full" />
          <UserButton />
        </div>
      </div>
    </>
  )
}
