import {
  RiAddLine,
  RiComputerLine,
  RiDashboardLine,
  RiDownloadLine,
  RiEyeFill,
  RiEyeLine,
  RiFileListLine,
  RiHistoryLine,
  RiMoonLine,
  RiNodeTree,
  RiRefreshLine,
  RiSunLine,
  RiTableLine,
  RiTerminalBoxLine,
} from '@remixicon/react'
import { CONNECTION_RESOURCE_ROOT_LABEL } from '@tamery/shared/constants'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@tamery/ui/components/command'
import { Kbd } from '@tamery/ui/components/kbd'
import { themeStore, useResolvedTheme } from '@tamery/ui/theme-store'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'

import { useCollections } from '~/entities/collections'
import type {
  Connection,
  ConnectionResource as ConnectionResourceType,
} from '~/entities/connection'
import {
  ConnectionIcon,
  getConnectionResourceStore,
  prefetchConnectionResourceCore,
  resourceTablesAndSchemasQueryOptions,
  useConnectionResourceLinkParams,
} from '~/entities/connection'
import { appStore, setIsActionCenterOpen } from '~/store'
import { checkForUpdates } from '~/use-updates-observer'

function ActionsResourceTables({
  connection,
  connectionResource,
}: {
  connection: Connection
  connectionResource: ConnectionResourceType
}) {
  const store = getConnectionResourceStore(connectionResource.id)
  const { data: tablesAndSchemas } = useQuery({
    ...resourceTablesAndSchemasQueryOptions({
      connectionResource,
      showSystem: store.get().showSystem,
    }),
    throwOnError: false,
  })
  const router = useRouter()

  if (!tablesAndSchemas) return null

  function onTableSelect(schema: string, table: string) {
    setIsActionCenterOpen(false)
    router.navigate({
      to: '/connection/$resourceId/table',
      params: { resourceId: connectionResource.id },
      search: { schema, table },
    })
  }

  return (
    <CommandGroup
      heading={`${connection.name}${connectionResource.name ? ` - ${connectionResource.name}` : ''} Tables`}
      value={connectionResource.name || CONNECTION_RESOURCE_ROOT_LABEL}
    >
      {tablesAndSchemas.schemas.map(schema =>
        schema.tables.map(table => (
          <CommandItem
            key={table.name}
            keywords={[schema.name, table.name]}
            value={`${schema.name}.${table.name}`}
            onSelect={() => onTableSelect(schema.name, table.name)}
          >
            {table.type === 'materialized view' ? (
              <RiEyeFill className="size-4 shrink-0 text-muted-foreground" />
            ) : table.type === 'view' ? (
              <RiEyeLine className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <RiTableLine className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span data-mask className="truncate">
              <span className="text-muted-foreground">{schema.name}.</span>
              {table.name}
            </span>
          </CommandItem>
        )),
      )}
    </CommandGroup>
  )
}

function ConnectionResource({
  connection,
  connectionResource,
}: {
  connection: Connection
  connectionResource: ConnectionResourceType
}) {
  const router = useRouter()
  const params = useConnectionResourceLinkParams(connectionResource.id)

  function onResourceSelect(connectionResource: ConnectionResourceType) {
    setIsActionCenterOpen(false)

    prefetchConnectionResourceCore(connectionResource)
    router.navigate(params)
  }

  return (
    <CommandItem onSelect={() => onResourceSelect(connectionResource)}>
      <ConnectionIcon type={connection.type} className="size-4 shrink-0" />
      <span data-mask className="truncate">
        {connection.name} - {connectionResource.name}
      </span>
      {connection.label && (
        <CommandShortcut className="tracking-normal">{connection.label}</CommandShortcut>
      )}
    </CommandItem>
  )
}

function run(action: () => void) {
  return () => {
    setIsActionCenterOpen(false)
    action()
  }
}

const CONNECTION_PAGES = [
  { label: 'SQL Runner', to: '/connection/$resourceId/query', icon: RiTerminalBoxLine },
  { label: 'Tables', to: '/connection/$resourceId/table', icon: RiTableLine },
  { label: 'Definitions', to: '/connection/$resourceId/definitions', icon: RiFileListLine },
  { label: 'Visualizer', to: '/connection/$resourceId/visualizer', icon: RiNodeTree },
] as const

export function ActionsCenter() {
  const { connectionsCollection, connectionsResourcesCollection } = useCollections()
  const { resourceId } = useParams({ strict: false })
  const { data } = useLiveQuery(
    q =>
      q
        .from({ connections: connectionsCollection })
        .innerJoin(
          { connectionResources: connectionsResourcesCollection },
          ({ connectionResources, connections }) =>
            eq(connectionResources.connectionId, connections.id),
        )
        .select(({ connections, connectionResources }) => ({
          connection: connections,
          connectionResource: connectionResources,
        }))
        .orderBy(({ connections }) => connections.createdAt, 'desc'),
    [connectionsCollection, connectionsResourcesCollection],
  )

  const isOpen = useSubscription(appStore, { selector: state => state.isActionCenterOpen })
  const router = useRouter()
  const resolvedTheme = useResolvedTheme()

  useHotkey('Mod+P', e => {
    // Keep the browser print dialog from hijacking the shortcut
    e.preventDefault()
    setIsActionCenterOpen(!isOpen)
  })

  const current = data?.find(({ connectionResource }) => connectionResource.id === resourceId)

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsActionCenterOpen}>
      <Command loop>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList className="max-h-140">
          <CommandEmpty>No commands found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              keywords={['dashboard']}
              onSelect={run(() => router.navigate({ to: '/' }))}
            >
              <RiDashboardLine className="size-4 shrink-0 text-muted-foreground" />
              Home
            </CommandItem>
            {current &&
              CONNECTION_PAGES.map(page => (
                <CommandItem
                  key={page.to}
                  keywords={['go to', page.label]}
                  onSelect={run(() =>
                    router.navigate({
                      to: page.to,
                      params: { resourceId: current.connectionResource.id },
                    }),
                  )}
                >
                  <page.icon className="size-4 shrink-0 text-muted-foreground" />
                  Go to {page.label}
                </CommandItem>
              ))}
            <CommandItem
              keywords={['new', 'create', 'database']}
              onSelect={run(() => router.navigate({ to: '/create' }))}
            >
              <RiAddLine className="size-4 shrink-0 text-muted-foreground" />
              Add new connection…
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Appearance">
            <CommandItem
              keywords={['theme', 'dark', 'light', 'mode']}
              onSelect={run(() => themeStore.set(resolvedTheme === 'dark' ? 'light' : 'dark'))}
            >
              {resolvedTheme === 'dark' ? (
                <RiSunLine className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <RiMoonLine className="size-4 shrink-0 text-muted-foreground" />
              )}
              Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} theme
            </CommandItem>
            <CommandItem
              keywords={['theme', 'system', 'auto']}
              onSelect={run(() => themeStore.set('system'))}
            >
              <RiComputerLine className="size-4 shrink-0 text-muted-foreground" />
              Use system theme
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Application">
            {current && (
              <CommandItem
                keywords={['logs', 'queries', 'history']}
                onSelect={run(() => {
                  const store = getConnectionResourceStore(current.connectionResource.id)
                  store.set(
                    state =>
                      ({ ...state, loggerOpened: !state.loggerOpened }) satisfies typeof state,
                  )
                })}
              >
                <RiHistoryLine className="size-4 shrink-0 text-muted-foreground" />
                Toggle query logger
              </CommandItem>
            )}
            {!!window.electron && (
              <CommandItem keywords={['update', 'version']} onSelect={run(() => checkForUpdates())}>
                <RiDownloadLine className="size-4 shrink-0 text-muted-foreground" />
                Check for updates…
              </CommandItem>
            )}
            <CommandItem
              keywords={['restart', 'refresh']}
              onSelect={() => window.location.reload()}
            >
              <RiRefreshLine className="size-4 shrink-0 text-muted-foreground" />
              Reload window
            </CommandItem>
          </CommandGroup>
          {!!data.length && (
            <CommandGroup heading="Connections">
              {data.map(({ connection, connectionResource }) => (
                <ConnectionResource
                  key={connectionResource.id}
                  connection={connection}
                  connectionResource={connectionResource}
                />
              ))}
            </CommandGroup>
          )}
          {current && (
            <ActionsResourceTables
              connection={current.connection}
              connectionResource={current.connectionResource}
            />
          )}
        </CommandList>
      </Command>
      <div
        className={`
          flex items-center gap-3 border-t px-3 py-1.5 text-2xs
          text-muted-foreground/70
        `}
      >
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <Kbd>↵</Kbd>
          open
        </span>
        <span className="flex items-center gap-1">
          <Kbd>esc</Kbd>
          close
        </span>
      </div>
    </CommandDialog>
  )
}
