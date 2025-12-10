import type { LinkProps } from '@tanstack/react-router'
import type { databases } from '~/drizzle'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { getOS } from '@conar/shared/utils/os'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@conar/ui/components/dialog'
import { Label } from '@conar/ui/components/label'
import { Separator } from '@conar/ui/components/separator'
import { Textarea } from '@conar/ui/components/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiCommandLine, RiFileListLine, RiListUnordered, RiMessageLine, RiMoonLine, RiNodeTree, RiPlayLargeLine, RiSettings3Line, RiSunLine, RiTableLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { Link, useMatches, useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ThemeToggle } from '~/components/theme-toggle'
import {
  DatabaseIcon,
  databasesCollection,
  databaseStore,
  lastOpenedDatabases,
  useDatabaseLinkParams,
  useLastOpenedDatabases,
} from '~/entities/database'
import { UserButton } from '~/entities/user'
import { orpcQuery } from '~/lib/orpc'
import { actionsCenterStore } from '~/routes/(protected)/-components/actions-center'
import { Route } from '../$id'

const os = getOS(navigator.userAgent)

function baseClasses(isActive = false) {
  return cn(
    'cursor-pointer text-foreground h-9 w-9 group-hover/sidebar:w-full rounded-md flex items-center justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-3 border border-transparent transition-all duration-300 gap-2',
    isActive && 'bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary',
  )
}

function SupportButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const { mutate: sendSupport, isPending: loading } = useMutation(orpcQuery.contact.mutationOptions({
    onSuccess: () => {
      toast.success('Support message sent successfully! We will get back to you as soon as possible.')
      setOpen(false)
      setMessage('')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Failed to send message. Please try again later.')
    },
  }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendSupport({ message })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 group-hover/sidebar:w-full group-hover/sidebar:justify-start group-hover/sidebar:px-3 gap-2" aria-label="Support">
                <RiMessageLine className="size-4 shrink-0" />
                <span className="hidden group-hover/sidebar:block whitespace-nowrap overflow-hidden text-ellipsis">Support</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">Support</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
        </DialogHeader>
        <div className="text-muted-foreground mb-2">
          Have a question, suggestion, or need assistance?
          We're here to listen!
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-message">Message</Label>
            <Textarea
              id="support-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              placeholder="Type any message you'd like to send us"
              className="min-h-48"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !message}>
              <LoadingContent loading={loading}>
                Send
              </LoadingContent>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SettingsButton() {
  const { database } = Route.useLoaderData()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/database/$id/settings" params={{ id: database.id }}>
            <Button size="icon" variant="ghost" className="h-9 w-9 group-hover/sidebar:w-full group-hover/sidebar:justify-start group-hover/sidebar:px-3 gap-2">
              <RiSettings3Line className="size-4 shrink-0" />
              <span className="hidden group-hover/sidebar:block whitespace-nowrap overflow-hidden text-ellipsis">Settings</span>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Settings</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function LastOpenedDatabase({ database }: { database: typeof databases.$inferSelect }) {
  const { id } = Route.useParams()
  const isActive = database.id === id
  const params = useDatabaseLinkParams(database.id)

  async function onCloseClick() {
    const newDatabases = lastOpenedDatabases.get().filter(dbId => dbId !== database.id)

    lastOpenedDatabases.set(newDatabases)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group">
            {!isActive && (
              <span
                className={cn(
                  'absolute z-10 top-0 right-0 -translate-y-1/2 translate-x-1/2',
                  'flex items-center justify-center',
                  'size-4 bg-background rounded-full text-foreground opacity-0 group-hover:opacity-100',
                )}
                onClick={onCloseClick}
              >
                <RiCloseLine className="size-3" />
              </span>
            )}
            <Link
              className={cn(
                baseClasses(isActive),
                database.color && isActive
                  ? 'text-(--color) bg-(--color)/10 hover:bg-(--color)/20 border-(--color)/20'
                  : '',
              )}
              style={database.color ? { '--color': database.color } : {}}
              {...params}
            >
              <span className="font-bold text-sm group-hover/sidebar:hidden">
                {database.name
                  .replace(/[^a-z0-9\s]/gi, '')
                  .split(/\s+/)
                  .map(word => word[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="font-medium text-sm hidden group-hover/sidebar:flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
                <DatabaseIcon type={database.type} className="size-4 shrink-0" />
                {database.name}
              </span>
            </Link>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          <span className="flex items-center gap-2 font-medium">
            <DatabaseIcon type={database.type} className="size-4 -ml-1" />
            {database.name}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function CurrentDatabase() {
  const { database } = Route.useLoaderData()
  const params = useDatabaseLinkParams(database.id)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group/db-item w-full">
            <Link
              className={cn(
                baseClasses(true),
                database.color
                  ? 'text-(--color) bg-(--color)/10 hover:bg-(--color)/20 border-(--color)/20'
                  : '',
              )}
              style={database.color ? { '--color': database.color } : {}}
              {...params}
            >
              <DatabaseIcon type={database.type} className="size-4 shrink-0" />
              <div className="hidden group-hover/sidebar:flex flex-col overflow-hidden">
                <span className="font-bold text-sm truncate leading-tight">{database.name}</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Current Database</span>
              </div>
            </Link>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          Current:
          {' '}
          {database.name}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function RecentDatabases() {
  const { database: currentDatabase } = Route.useLoaderData()
  const { data: databases } = useLiveQuery(q => q
    .from({ databases: databasesCollection })
    .orderBy(({ databases }) => databases.createdAt, 'desc'))
  const [lastOpenedDatabases] = useLastOpenedDatabases()

  const filteredDatabases = (databases?.filter(database => lastOpenedDatabases.includes(database.id) && database.id !== currentDatabase.id) ?? [])
    .toSorted((a, b) => lastOpenedDatabases.indexOf(a.id) - lastOpenedDatabases.indexOf(b.id))

  return filteredDatabases.map(database => <LastOpenedDatabase key={database.id} database={database} />)
}

function MainLinks() {
  const { database } = Route.useLoaderData()
  const { schema: schemaParam, table: tableParam } = useSearch({ strict: false })
  const matches = useMatches({
    select: matches => matches.map(match => match.routeId),
  })
  const store = databaseStore(database.id)
  const lastOpenedTable = useStore(store, state => state.lastOpenedTable)

  useEffect(() => {
    if (tableParam && schemaParam && tableParam !== lastOpenedTable?.table && schemaParam !== lastOpenedTable?.schema) {
      store.setState(state => ({
        ...state,
        lastOpenedTable: { schema: schemaParam, table: tableParam },
      } satisfies typeof state))
    }
  }, [store, lastOpenedTable, tableParam, schemaParam])

  const isActiveSql = matches.includes('/(protected)/_protected/database/$id/sql/')
  const isActiveTables = matches.includes('/(protected)/_protected/database/$id/table/')
  const isActiveEnums = matches.includes('/(protected)/_protected/database/$id/enums/')
  const isActiveVisualizer = matches.includes('/(protected)/_protected/database/$id/visualizer/')

  const isCurrentTableAsLastOpened = lastOpenedTable?.schema === schemaParam && lastOpenedTable?.table === tableParam

  const route = useMemo(() => {
    if (!isCurrentTableAsLastOpened && lastOpenedTable) {
      return {
        to: '/database/$id/table',
        params: { id: database.id },
        search: { schema: lastOpenedTable.schema, table: lastOpenedTable.table },
      } satisfies LinkProps
    }

    return { to: '/database/$id/table', params: { id: database.id } } satisfies LinkProps
  }, [database.id, isCurrentTableAsLastOpened, lastOpenedTable])

  function onTablesClick() {
    if (isCurrentTableAsLastOpened && lastOpenedTable) {
      store.setState(state => ({
        ...state,
        lastOpenedTable: null,
      } satisfies typeof state))
    }
  }

  const lastOpenedChatId = useStore(store, state => state.lastOpenedChatId)

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/database/$id/sql"
              params={{ id: database.id }}
              search={lastOpenedChatId ? { chatId: lastOpenedChatId } : undefined}
              className={baseClasses(isActiveSql)}
            >
              <RiPlayLargeLine className="size-4 shrink-0" />
              <span className="hidden group-hover/sidebar:block whitespace-nowrap overflow-hidden text-ellipsis">SQL Runner</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">SQL Runner</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              className={baseClasses(isActiveTables)}
              {...route}
              onClick={() => {
                onTablesClick()
              }}
            >
              <RiTableLine className="size-4 shrink-0" />
              <span className="hidden group-hover/sidebar:block whitespace-nowrap overflow-hidden text-ellipsis">Tables</span>
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
              params={{ id: database.id }}
              className={baseClasses(isActiveEnums)}
            >
              <RiListUnordered className="size-4 shrink-0" />
              <span className="hidden group-hover/sidebar:block whitespace-nowrap overflow-hidden text-ellipsis">Enums</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            Enums
            {database.type === DatabaseType.MySQL && ' & Sets'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/database/$id/visualizer" params={{ id: database.id }} className={baseClasses(isActiveVisualizer)}>
              <RiNodeTree className="size-4 shrink-0" />
              <span className="hidden group-hover/sidebar:block whitespace-nowrap overflow-hidden text-ellipsis">Visualizer</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Visualizer</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  )
}

export function DatabaseSidebar({ className, ...props }: React.ComponentProps<'div'>) {
  const { database } = Route.useLoaderData()
  const [lastOpenedDatabases] = useLastOpenedDatabases()
  const store = databaseStore(database.id)

  return (
    <>
      <div className={className} />
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 h-full z-50 flex flex-col items-center border-r bg-background transition-all duration-300 ease-in-out group/sidebar overflow-hidden group-hover/sidebar:shadow-xl',
          className,
          'hover:w-64 hover:items-stretch focus-within:w-64 focus-within:items-stretch group-hover/sidebar:w-64 group-hover/sidebar:items-stretch group-focus-within/sidebar:w-64 group-focus-within/sidebar:items-stretch',
        )}
        {...props}
      >
        <div className="flex flex-col p-4 pb-0 items-center group-hover/sidebar:items-start group-hover/sidebar:px-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className="p-2 flex items-center group-hover/sidebar:w-full group-hover/sidebar:px-3 rounded-md hover:bg-muted"
                >
                  <AppLogo className="size-6 text-primary shrink-0" />
                  <div className="ml-2 hidden group-hover/sidebar:flex flex-col overflow-hidden">
                    <span className="font-bold text-lg leading-none">Conar</span>
                    <span className="text-xs text-muted-foreground truncate" title={database.name}>{database.name}</span>
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ScrollArea className="relative p-4 flex flex-col items-center flex-1 gap-2 group-hover/sidebar:items-stretch">
          <div className="w-full">
            <div className="flex w-full flex-col">
              <MainLinks />
              <Separator className="my-4" />
              <CurrentDatabase />
              {lastOpenedDatabases.length > 1 && (
                <>
                  <Separator className="my-4" />
                  <div className="hidden group-hover/sidebar:block px-2 pb-2 text-[10px] uppercase text-muted-foreground font-medium tracking-wider">
                    Recent Databases
                  </div>
                  <RecentDatabases />
                </>
              )}
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 pt-0 flex flex-col items-center group-hover/sidebar:items-stretch">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => store.setState(state => ({ ...state, loggerOpened: !state.loggerOpened } satisfies typeof state))}
                  className="h-9 w-9 group-hover/sidebar:w-full group-hover/sidebar:justify-start group-hover/sidebar:px-3"
                >
                  <RiFileListLine className="size-4 shrink-0" />
                  <span className="hidden group-hover/sidebar:block whitespace-nowrap overflow-hidden text-ellipsis">Query Logger</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Query Logger</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator className="my-4" />
          <SupportButton />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => actionsCenterStore.setState(state => ({ ...state, isOpen: true }))}
                  className="h-9 w-9 group-hover/sidebar:w-full group-hover/sidebar:justify-start group-hover/sidebar:px-3"
                >
                  <RiCommandLine className="size-4 shrink-0" />
                  <span className="hidden group-hover/sidebar:block whitespace-nowrap overflow-hidden text-ellipsis">Command Palette</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {os?.type === 'macos' ? '⌘' : 'Ctrl'}
                P
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ThemeToggle>
            <Button size="icon" variant="ghost" className="h-9 w-9 group-hover/sidebar:w-full group-hover/sidebar:justify-start group-hover/sidebar:px-3 gap-2" aria-label="Theme">
              <RiSunLine className="size-4 dark:hidden shrink-0" />
              <RiMoonLine className="size-4 hidden dark:block shrink-0" />
              <span className="hidden group-hover/sidebar:block whitespace-nowrap overflow-hidden text-ellipsis">Theme</span>
            </Button>
          </ThemeToggle>
          {false && <SettingsButton />}
          <div className="flex justify-center group-hover/sidebar:justify-start">
            <UserButton />
          </div>
        </div>
      </div>
    </>
  )
}
