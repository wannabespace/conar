import type { LinkProps } from '@tanstack/react-router'
import type { databases } from '~/drizzle'
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
import { RiCloseLine, RiCommandLine, RiFileListLine, RiListUnordered, RiMessageLine, RiMoonLine, RiNodeTree, RiPlayLargeLine, RiSunLine, RiTableLine } from '@remixicon/react'
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
  lastOpenedDatabases,
  useDatabaseLinkParams,
  useLastOpenedDatabases,
} from '~/entities/database'
import { UserButton } from '~/entities/user'
import { orpcQuery } from '~/lib/orpc'
import { actionsCenterStore } from '~/routes/(protected)/-components/actions-center'
import { Route } from '../$id'
import { databaseStore } from '../-store'

const os = getOS(navigator.userAgent)

function classes(isActive = false) {
  return cn(
    'cursor-pointer text-foreground size-9 rounded-md flex items-center justify-center border border-transparent',
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
              <Button size="icon" variant="ghost">
                <RiMessageLine className="size-4" />
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
              className={classes(isActive)}
              {...params}
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

function LastOpenedDatabases() {
  const { data: databases } = useLiveQuery(q => q
    .from({ databases: databasesCollection })
    .orderBy(({ databases }) => databases.createdAt, 'desc'))
  const [lastOpenedDatabases] = useLastOpenedDatabases()
  const filteredDatabases = (databases?.filter(database => lastOpenedDatabases.includes(database.id)) ?? [])
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
              {...route}
              onClick={() => {
                onTablesClick()
              }}
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
              params={{ id: database.id }}
              className={classes(isActiveEnums)}
            >
              <RiListUnordered className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Enums</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/database/$id/visualizer" params={{ id: database.id }} className={classes(isActiveVisualizer)}>
              <RiNodeTree className="size-4" />
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
    <div className={cn('flex flex-col items-center', className)} {...props}>
      <div className="flex flex-col p-4 pb-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/"
                className="p-2"
              >
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
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => store.setState(state => ({ ...state, loggerOpened: !state.loggerOpened } satisfies typeof state))}
              >
                <RiFileListLine className="size-4" />
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
              >
                <RiCommandLine className="size-4" />
              </Button>
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
