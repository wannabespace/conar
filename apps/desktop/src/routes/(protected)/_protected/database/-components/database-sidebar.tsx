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
import { clickHandlers, cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiCommandLine, RiListUnordered, RiMessageLine, RiMoonLine, RiPlayLargeLine, RiSunLine, RiTableLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { Link, useMatches, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ThemeToggle } from '~/components/theme-toggle'
import { DatabaseIcon, databasesCollection } from '~/entities/database'
import { UserButton } from '~/entities/user'
import { orpc } from '~/lib/orpc'
import { actionsCenterStore } from '~/routes/(protected)/-components/actions-center'
import { Route } from '../$id'
import { useLastOpenedChatId } from '../$id/sql/-chat'
import { lastOpenedTable, useLastOpenedTable } from '../$id/table/-lib'
import { lastOpenedDatabases, useLastOpenedDatabases } from '../-lib'

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

  const { mutate: sendSupport, isPending: loading } = useMutation({
    mutationFn: async () => {
      await orpc.contact({ message })
    },
    onSuccess: () => {
      toast.success('Support message sent successfully! We will get back to you as soon as possible.')
      setOpen(false)
      setMessage('')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Failed to send message. Please try again later.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendSupport()
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
  const navigate = useNavigate()
  const [lastOpenedTable] = useLastOpenedTable(database.id)
  const isActive = database.id === id

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
              to="/database/$id/table"
              className={classes(isActive)}
              params={{ id: database.id }}
              search={lastOpenedTable ? { schema: lastOpenedTable.schema, table: lastOpenedTable.table } : undefined}
              {...clickHandlers(() => navigate({
                to: '/database/$id/table',
                params: { id: database.id },
                search: lastOpenedTable ? { schema: lastOpenedTable.schema, table: lastOpenedTable.table } : undefined,
              }))}
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
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { schema: schemaParam, table: tableParam } = useSearch({ strict: false })
  const matches = useMatches({
    select: matches => matches.map(match => match.routeId),
  })
  const [lastTable, setLastTable] = useLastOpenedTable(id)

  useEffect(() => {
    if (tableParam && schemaParam && tableParam !== lastTable?.table && schemaParam !== lastTable?.schema) {
      setLastTable({ schema: schemaParam, table: tableParam })
    }
  }, [setLastTable, lastTable, tableParam, schemaParam])

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
      lastOpenedTable(id).set(null)
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
              {...clickHandlers(() => navigate({
                to: '/database/$id/sql',
                params: { id },
                search: lastOpenedChatId ? { chatId: lastOpenedChatId } : undefined,
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
              {...route}
              {...clickHandlers(() => {
                navigate(route)
                onTablesClick()
              })}
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
    </>
  )
}

export function DatabaseSidebar({ className, ...props }: React.ComponentProps<'div'>) {
  const [lastOpenedDatabases] = useLastOpenedDatabases()
  const navigate = useNavigate()

  return (
    <div className={cn('flex flex-col items-center', className)} {...props}>
      <div className="flex flex-col p-4 pb-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/"
                className="p-2"
                {...clickHandlers(() => navigate({ to: '/' }))}
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
        <SupportButton />
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
