import { getOS } from '@connnect/shared/utils/os'
import { AppLogo } from '@connnect/ui/components/brand/app-logo'
import { Button } from '@connnect/ui/components/button'
import { ScrollArea } from '@connnect/ui/components/custom/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { clickHandlers, cn } from '@connnect/ui/lib/utils'
import { RiCommandLine, RiListUnordered, RiMoonLine, RiPlayLargeLine, RiSunLine, RiTableLine } from '@remixicon/react'
import { Link, useMatches, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { ThemeToggle } from '~/components/theme-toggle'
import { UserButton } from '~/entities/user'
import { actionsCenterStore } from '~/routes/(protected)/-components/actions-center'
import { Route } from '../$id'

const os = getOS()

export function DatabaseSidebar({ className, ...props }: React.ComponentProps<'div'>) {
  const { id } = Route.useParams()
  const { table: tableParam, schema: schemaParam } = useParams({ strict: false })
  const lastOpenedTableRef = useRef<{ schema: string, table: string } | null>(null)
  const navigate = useNavigate()
  const matches = useMatches({
    select: matches => matches.map(match => match.routeId),
  })

  useEffect(() => {
    if (tableParam && schemaParam) {
      lastOpenedTableRef.current = { schema: schemaParam, table: tableParam }
    }
  }, [tableParam, schemaParam])

  const isActiveSql = matches.includes('/(protected)/_protected/database/$id/sql/')
  const isActiveTables = matches.includes('/(protected)/_protected/database/$id/tables')
  const isActiveEnums = matches.includes('/(protected)/_protected/database/$id/enums/')

  function onTablesClick() {
    if (lastOpenedTableRef.current?.schema === schemaParam && lastOpenedTableRef.current?.table === tableParam) {
      lastOpenedTableRef.current = null
    }

    if (lastOpenedTableRef.current) {
      navigate({
        to: '/database/$id/tables/$schema/$table',
        params: {
          id,
          schema: lastOpenedTableRef.current.schema,
          table: lastOpenedTableRef.current.table,
        },
      })
    }
    else {
      navigate({
        to: '/database/$id/tables',
        params: { id },
      })
    }
  }

  const classes = (isActive = false) => cn(
    'cursor-pointer text-foreground size-9 rounded-md flex items-center justify-center',
    isActive && 'bg-background hover:bg-background',
  )

  return (
    <div className={cn('flex flex-col items-center h-screen', className)} {...props}>
      <div className="flex flex-col p-4 pb-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/" className="p-2">
                <AppLogo className="size-6 text-primary" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Dashboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="relative p-4 flex flex-col items-center flex-1 gap-2">
        <div className="w-full">
          <div className="flex w-full flex-col">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/database/$id/sql"
                    params={{ id }}
                    className={classes(isActiveSql)}
                    {...clickHandlers(() => navigate({
                      to: '/database/$id/sql',
                      params: { id },
                    }))}
                  >
                    <RiPlayLargeLine className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">SQL Runner</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/database/$id/tables"
                    params={{ id }}
                    className={classes(isActiveTables)}
                    {...clickHandlers(onTablesClick)}
                  >
                    <RiTableLine className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Tables</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/database/$id/enums"
                    params={{ id }}
                    className={classes(isActiveEnums)}
                    {...clickHandlers(() => navigate({
                      to: '/database/$id/enums',
                      params: { id },
                    }))}
                  >
                    <RiListUnordered className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Enums</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 pt-0 flex flex-col items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              className={classes()}
              onClick={() => actionsCenterStore.setState(state => ({ ...state, isOpen: true }))}
            >
              <RiCommandLine className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="right">
              {os === 'macos' ? '⌘' : 'Ctrl'}
              P
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="relative mb-2">
          <ThemeToggle>
            <Button size="icon" variant="ghost">
              <RiSunLine className="size-4 dark:hidden" />
              <RiMoonLine className="size-4 hidden dark:block" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </ThemeToggle>
        </div>
        <UserButton />
      </div>
    </div>
  )
}
