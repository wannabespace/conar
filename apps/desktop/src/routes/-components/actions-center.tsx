import type { connections, connectionsResources } from '~/drizzle'
import { isCtrlAndKey } from '@conar/shared/utils/os'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@conar/ui/components/command'
import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { RiAddLine, RiDashboardLine, RiRefreshLine, RiTableLine } from '@remixicon/react'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { ConnectionIcon } from '~/entities/connection/components'
import { useConnectionResourceLinkParams } from '~/entities/connection/hooks'
import { resourceTablesAndSchemasQuery } from '~/entities/connection/queries'
import { connectionResourceStore } from '~/entities/connection/store'
import { connectionsCollection, connectionsResourcesCollection } from '~/entities/connection/sync'
import { prefetchConnectionResourceCore } from '~/entities/connection/utils'
import { appStore, setIsActionCenterOpen } from '~/store'

function ActionsResourceTables({ connection, connectionResource }: { connection: typeof connections.$inferSelect, connectionResource: typeof connectionsResources.$inferSelect }) {
  const store = connectionResourceStore(connectionResource.id)
  const { data: tablesAndSchemas } = useQuery({
    ...resourceTablesAndSchemasQuery({ connectionResource, showSystem: store.state.showSystem }),
    throwOnError: false,
  })
  const router = useRouter()

  if (!tablesAndSchemas)
    return null

  function onTableSelect(schema: string, table: string) {
    setIsActionCenterOpen(false)
    router.navigate({ to: '/connection/$resourceId/table', params: { resourceId: connectionResource.id }, search: { schema, table } })
  }

  return (
    <CommandGroup heading={`${connection.name} - ${connectionResource.name} Tables`} value={connectionResource.name}>
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

function ConnectionResource({ connection, connectionResource }: { connection: typeof connections.$inferSelect, connectionResource: typeof connectionsResources.$inferSelect }) {
  const router = useRouter()
  const params = useConnectionResourceLinkParams(connectionResource.id)

  function onResourceSelect(connectionResource: typeof connectionsResources.$inferSelect) {
    setIsActionCenterOpen(false)

    prefetchConnectionResourceCore(connectionResource)
    router.navigate(params)
  }

  return (
    <CommandItem
      onSelect={() => onResourceSelect(connectionResource)}
    >
      <ConnectionIcon
        type={connection.type}
        className="size-4 shrink-0"
      />
      <div className="flex items-center gap-2">
        {connection.name}
        {' '}
        -
        {' '}
        {connectionResource.name}
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
  const { resourceId } = useParams({ strict: false })
  const { data } = useLiveQuery(q => q
    .from({ connections: connectionsCollection })
    .innerJoin(
      { connectionResources: connectionsResourcesCollection },
      ({ connectionResources, connections }) => eq(connectionResources.connectionId, connections.id),
    )
    .select(({ connections, connectionResources }) => ({
      connection: connections,
      connectionResource: connectionResources,
    }))
    .orderBy(({ connections }) => connections.createdAt, 'desc'))
  const isOpen = useStore(appStore, state => state.isActionCenterOpen)
  const router = useRouter()

  useKeyboardEvent(e => isCtrlAndKey(e, 'p'), () => {
    if (data.length === 0)
      return

    setIsActionCenterOpen(!isOpen)
  })

  const current = data?.find(({ connectionResource }) => connectionResource.id === resourceId)

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
        {!!data.length && (
          <CommandGroup heading="Connections">
            {data.map(({ connection, connectionResource }) =>
              <ConnectionResource key={connectionResource.id} connection={connection} connectionResource={connectionResource} />,
            )}
          </CommandGroup>
        )}
        {current && <ActionsResourceTables connection={current.connection} connectionResource={current.connectionResource} />}
      </CommandList>
    </CommandDialog>
  )
}
