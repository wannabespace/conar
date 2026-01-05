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
import { RiCloseLine, RiCommandLine, RiFileListLine, RiListUnordered, RiMessageLine, RiMoonLine, RiNodeTree, RiPlayLargeLine, RiSettings3Line, RiShieldCheckLine, RiSunLine, RiTableLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { Link, useMatches, useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ThemeToggle } from '~/components/theme-toggle'
import { DatabaseIcon } from '~/entities/database/components'
import { useDatabaseLinkParams } from '~/entities/database/hooks'
import { databaseStore } from '~/entities/database/store'
import { databasesCollection } from '~/entities/database/sync'
import { lastOpenedDatabases, useLastOpenedDatabases } from '~/entities/database/utils'
import { UserButton } from '~/entities/user/components'
import { orpcQuery } from '~/lib/orpc'
import { actionsCenterStore } from '~/routes/(protected)/-components/actions-center'
import { Route } from '../$id'

const os = getOS(navigator.userAgent)

function baseClasses(isActive = false) {
  return cn(
    `
      flex size-9 cursor-pointer items-center justify-center rounded-md border
      border-transparent text-foreground
    `,
    isActive && `
      border-primary/20 bg-primary/10 text-primary
      hover:bg-primary/20
    `,
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
        <div className="mb-2 text-muted-foreground">
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
            <Button size="icon" variant="ghost">
              <RiSettings3Line className="size-4" />
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
          <div className="group relative">
            {!isActive && (
              <span
                className={cn(
                  'absolute top-0 right-0 z-10 translate-x-1/2 -translate-y-1/2',
                  'flex items-center justify-center',
                  `
                    size-4 rounded-full bg-background text-foreground opacity-0
                    group-hover:opacity-100
                  `,
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
                  ? `
                    border-(--color)/20 bg-(--color)/10 text-(--color)
                    hover:bg-(--color)/20
                  `
                  : '',
              )}
              style={database.color ? { '--color': database.color } : {}}
              {...params}
            >
              <span className="text-sm font-bold">
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
            <DatabaseIcon type={database.type} className="-ml-1 size-4" />
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
  const isActiveConstraints = matches.includes('/(protected)/_protected/database/$id/constraint-index-tabs')
  const isActiveIndexes = isActiveConstraints
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
              className={baseClasses(isActiveTables)}
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
              className={baseClasses(isActiveEnums)}
            >
              <RiListUnordered className="size-4" />
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
            <Link
              to="/database/$id/constraint-index-tabs"
              params={{ id: database.id }}
              className={baseClasses(isActiveConstraints || isActiveIndexes)}
            >
              <RiShieldCheckLine className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Constraints & Indexes</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/database/$id/visualizer" params={{ id: database.id }} className={baseClasses(isActiveVisualizer)}>
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
      <ScrollArea className={`
        relative flex flex-1 flex-col items-center gap-2 p-4
      `}
      >
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
      <div className="flex flex-col items-center p-4 pt-0">
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
        <ThemeToggle>
          <Button size="icon" variant="ghost">
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
        {false && <SettingsButton />}
        <div className="mt-2">
          <UserButton />
        </div>
      </div>
    </div>
  )
}
