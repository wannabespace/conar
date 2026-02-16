import type { connections } from '~/drizzle'
import { isCtrlAndKey } from '@conar/shared/utils/os'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@conar/ui/components/command'
import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { RiAddLine, RiDashboardLine, RiRefreshLine, RiTableLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { ConnectionIcon } from '~/entities/connection/components'
import { useConnectionLinkParams } from '~/entities/connection/hooks'
import { connectionTablesAndSchemasQuery } from '~/entities/connection/queries'
import { connectionsCollection } from '~/entities/connection/sync'
import { prefetchConnectionCore } from '~/entities/connection/utils'
import { appStore, setIsActionCenterOpen } from '~/store'

function ActionsConnectionTables({ connection }: { connection: typeof connections.$inferSelect }) {
  const { data: tablesAndSchemas } = useQuery({
    ...connectionTablesAndSchemasQuery({ connection }),
    throwOnError: false,
  })
  const router = useRouter()

  if (!tablesAndSchemas)
    return null

  function onTableSelect(schema: string, table: string) {
    setIsActionCenterOpen(false)
    router.navigate({ to: '/database/$id/table', params: { id: connection.id }, search: { schema, table } })
  }

  return (
    <CommandGroup heading={`${connection.name} Tables`} value={connection.name}>
      {tablesAndSchemas.schemas.map(schema => schema.tables.map(table => (
        <CommandItem
          key={table}
          keywords={[schema.name, table]}
          value={`${schema.name}.${table}`}
          onSelect={() => onTableSelect(schema.name, table)}
        >
          <RiTableLine className="size-4 shrink-0 text-muted-foreground" />
          {schema.name}
          .
          {table}
        </CommandItem>
      )))}
    </CommandGroup>
  )
}

function ActionsConnection({ connection }: { connection: typeof connections.$inferSelect }) {
  const router = useRouter()
  const params = useConnectionLinkParams(connection.id)

  function onConnectionSelect(connection: typeof connections.$inferSelect) {
    setIsActionCenterOpen(false)

    prefetchConnectionCore(connection)
    router.navigate(params)
  }

  return (
    <CommandItem
      key={connection.id}
      onSelect={() => onConnectionSelect(connection)}
    >
      <ConnectionIcon type={connection.type} className="size-4 shrink-0" />
      <div className="flex items-center gap-2">
        {connection.name}
        {connection.label && (
          <span className={`
            rounded-full bg-muted-foreground/10 px-2 py-0.5 text-xs
            whitespace-nowrap text-muted-foreground
          `}
          >
            {connection.label}
          </span>
        )}
      </div>
    </CommandItem>
  )
}

export function ActionsCenter() {
  const { data: connections } = useLiveQuery(q => q
    .from({ connections: connectionsCollection })
    .orderBy(({ connections }) => connections.createdAt, 'desc'))
  const isOpen = useStore(appStore, state => state.isActionCenterOpen)
  const router = useRouter()
  const { id } = useParams({ strict: false })

  useKeyboardEvent(e => isCtrlAndKey(e, 'p'), () => {
    if (!connections || connections.length === 0)
      return

    setIsActionCenterOpen(!isOpen)
  })

  const currentConnection = connections?.find(connection => connection.id === id)

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsActionCenterOpen}>
      <CommandInput placeholder="Type a command..." />
      <CommandList className="max-h-140">
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Commands">
          <CommandItem
            onSelect={() => {
              setIsActionCenterOpen(false)
              router.navigate({ to: '/' })
            }}
          >
            <RiDashboardLine className="size-4 shrink-0 text-muted-foreground" />
            Dashboard
          </CommandItem>
          <CommandItem
            onSelect={() => {
              window.location.reload()
            }}
          >
            <RiRefreshLine className="size-4 shrink-0 text-muted-foreground" />
            Reload window
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setIsActionCenterOpen(false)
              router.navigate({ to: '/create' })
            }}
          >
            <RiAddLine className="size-4 shrink-0 text-muted-foreground" />
            Add new connection...
          </CommandItem>
        </CommandGroup>
        {!!connections?.length && (
          <CommandGroup heading="Connections">
            {connections.map(connection => <ActionsConnection key={connection.id} connection={connection} />)}
          </CommandGroup>
        )}
        {currentConnection && <ActionsConnectionTables connection={currentConnection} />}
      </CommandList>
    </CommandDialog>
  )
}
