import type { LinkProps } from '@tanstack/react-router'
import type { databases } from '~/drizzle'
import { getOS } from '@conar/shared/utils/os'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCommandLine, RiListUnordered, RiMoonLine, RiPlayLargeLine, RiSunLine, RiTableLine } from '@remixicon/react'
import { Link, useMatches, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { ThemeToggle } from '~/components/theme-toggle'
import { DatabaseIcon, useDatabasesLive } from '~/entities/database'
import { UserButton } from '~/entities/user'
import { actionsCenterStore } from '~/routes/(protected)/-components/actions-center'
import { Route } from '../$id'
import { useLastOpenedChatId } from '../$id/sql/-chat'
import { lastOpenedTable, useLastOpenedTable } from '../$id/table/-lib'
import { useLastOpenedDatabases } from '../-lib'

const os = getOS(navigator.userAgent)

function classes(isActive = false) {
  return cn(
    'cursor-pointer text-foreground size-9 rounded-md flex items-center justify-center border border-transparent',
    isActive && 'bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary',
  )
}

function LastOpenedDatabase({ database }: { database: typeof databases.$inferSelect }) {
  const { id } = Route.useParams()
  const [lastOpenedTable] = useLastOpenedTable(database.id)
  const isActive = database.id === id

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/database/$id/table"
            className={classes(isActive)}
            params={{ id: database.id }}
            search={lastOpenedTable ? { schema: lastOpenedTable.schema, table: lastOpenedTable.table } : undefined}
          >
            <span className="font-bold text-sm">
              {database.name
                .replace(/[^a-z0-9\s]/gi, '')
                .split(/\s+/)
                .map(word => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          <span className="flex items-center gap-2 font-medium">
            <DatabaseIcon type={database.type} className="size-4 -ml-1" />
            {database.name}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function LastOpenedDatabases() {
  const { data: databases } = useDatabasesLive()
  const [lastOpenedDatabases] = useLastOpenedDatabases()
  const filteredDatabases = (databases?.filter(database => lastOpenedDatabases.includes(database.id)) ?? [])
    .toSorted((a, b) => lastOpenedDatabases.indexOf(a.id) - lastOpenedDatabases.indexOf(b.id))

  return filteredDatabases.map(database => <LastOpenedDatabase key={database.id} database={database} />)
}

function MainLinks() {
  const { id } = Route.useParams()
  const { schema: schemaParam, table: tableParam } = useSearch({ strict: false })
  const matches = useMatches({
    select: matches => matches.map(match => match.routeId),
  })
  const [lastTable] = useLastOpenedTable(id)

  useEffect(() => {
    if (tableParam && schemaParam && tableParam !== lastTable?.table && schemaParam !== lastTable?.schema) {
      lastOpenedTable.set(id, { schema: schemaParam, table: tableParam })
    }
  }, [tableParam, schemaParam])

  const isActiveSql = matches.includes('/(protected)/_protected/database/$id/sql/')
  const isActiveTables = matches.includes('/(protected)/_protected/database/$id/table/')
  const isActiveEnums = matches.includes('/(protected)/_protected/database/$id/enums/')

  const isCurrentTableAsLastOpened = lastTable?.schema === schemaParam && lastTable?.table === tableParam

  const route = useMemo(() => {
    if (!isCurrentTableAsLastOpened && lastTable) {
      return {
        to: '/database/$id/table',
        params: { id },
        search: { schema: lastTable.schema, table: lastTable.table },
      } satisfies LinkProps
    }

    return { to: '/database/$id/table', params: { id } } satisfies LinkProps
  }, [id, isCurrentTableAsLastOpened, lastTable])

  function onTablesClick() {
    if (isCurrentTableAsLastOpened && lastTable) {
      lastOpenedTable.set(id, null)
    }
  }

  const [lastOpenedChatId] = useLastOpenedChatId(id)

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/database/$id/sql"
              params={{ id }}
              search={lastOpenedChatId ? { chatId: lastOpenedChatId } : undefined}
              className={classes(isActiveSql)}
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
              onClick={onTablesClick}
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
            >
              <RiListUnordered className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Enums</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  )
}

export function DatabaseSidebar({ className, ...props }: React.ComponentProps<'div'>) {
  const [lastOpenedDatabases] = useLastOpenedDatabases()

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
            <MainLinks />
            {lastOpenedDatabases.length > 1 && (
              <>
                <Separator className="my-4" />
                <LastOpenedDatabases />
              </>
            )}
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
