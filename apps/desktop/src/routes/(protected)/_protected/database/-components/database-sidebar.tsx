import { getOS } from '@conar/shared/utils/os'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { clickHandlers, cn } from '@conar/ui/lib/utils'
import { RiCommandLine, RiListUnordered, RiMoonLine, RiPlayLargeLine, RiSunLine, RiTableLine } from '@remixicon/react'
import { Link, useMatches, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { ThemeToggle } from '~/components/theme-toggle'
import { UserButton } from '~/entities/user'
import { actionsCenterStore } from '~/routes/(protected)/-components/actions-center'
import { Route } from '../$id'
import { useLastOpenedTable } from '../-hooks/use-last-opened-table'

const os = getOS(navigator.userAgent)

export function DatabaseSidebar({ className, ...props }: React.ComponentProps<'div'>) {
  const { id } = Route.useParams()
  const { table: tableParam, schema: schemaParam } = useParams({ strict: false })
  const navigate = useNavigate()
  const matches = useMatches({
    select: matches => matches.map(match => match.routeId),
  })
  const [lastOpenedTable, setLastOpenedTable] = useLastOpenedTable(id)

  useEffect(() => {
    if (tableParam && schemaParam) {
      setLastOpenedTable({ schema: schemaParam, table: tableParam })
    }
  }, [tableParam, schemaParam])

  const isActiveSql = matches.includes('/(protected)/_protected/database/$id/sql/')
  const isActiveTables = matches.includes('/(protected)/_protected/database/$id/tables')
  const isActiveEnums = matches.includes('/(protected)/_protected/database/$id/enums/')

  const isCurrentTableAsLastOpened = lastOpenedTable?.schema === schemaParam && lastOpenedTable?.table === tableParam

  const route = useMemo(() => {
    if (!isCurrentTableAsLastOpened && lastOpenedTable) {
      return {
        to: '/database/$id/tables/$schema/$table',
        params: {
          id,
          schema: lastOpenedTable.schema,
          table: lastOpenedTable.table,
        },
      }
    }

    return { to: '/database/$id/tables', params: { id } }
  }, [isCurrentTableAsLastOpened, lastOpenedTable])

  function onTablesClick() {
    if (isCurrentTableAsLastOpened && lastOpenedTable) {
      setLastOpenedTable(null)
    }
  }

  const classes = (isActive = false) => cn(
    'cursor-pointer text-foreground size-9 rounded-md flex items-center justify-center border border-transparent',
    isActive && 'bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary',
  )

  return (
    <div className={cn('flex flex-col items-center', className)} {...props}>
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
                    className={classes(isActiveTables)}
                    {...clickHandlers(() => {
                      onTablesClick()
                      navigate(route)
                    })}
                    {...route}
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
              {os?.type === 'macos' ? '⌘' : 'Ctrl'}
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
