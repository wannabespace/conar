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
  RiSearchLine,
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
  CommandItem,
  CommandList,
  CommandPrimitive,
  CommandShortcut,
} from '@tamery/ui/components/command'
import { Kbd } from '@tamery/ui/components/kbd'
import { themeStore, useResolvedTheme } from '@tamery/ui/theme-store'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import type { ComponentProps, ReactNode } from 'react'
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

const CONNECTION_PAGES = [
  { label: 'SQL Runner', to: '/connection/$resourceId/query', icon: RiTerminalBoxLine },
  { label: 'Tables', to: '/connection/$resourceId/table', icon: RiTableLine },
  { label: 'Definitions', to: '/connection/$resourceId/definitions', icon: RiFileListLine },
  { label: 'Visualizer', to: '/connection/$resourceId/visualizer', icon: RiNodeTree },
] as const

const TABLE_TYPE_ICONS = {
  'materialized view': RiEyeFill,
  'view': RiEyeLine,
  'table': RiTableLine,
} as const

function run(action: () => void) {
  return () => {
    setIsActionCenterOpen(false)
    action()
  }
}

function Action({
  icon: Icon,
  children,
  ...props
}: ComponentProps<typeof CommandItem> & {
  icon: typeof RiTableLine
  children: ReactNode
}) {
  return (
    <CommandItem {...props}>
      <Icon className="text-muted-foreground" />
      {children}
    </CommandItem>
  )
}

function ResourceTables({
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
        schema.tables.map(table => {
          const Icon = TABLE_TYPE_ICONS[table.type as keyof typeof TABLE_TYPE_ICONS] ?? RiTableLine

          return (
            <Action
              key={table.name}
              icon={Icon}
              keywords={[schema.name, table.name]}
              value={`${schema.name}.${table.name}`}
              onSelect={() => onTableSelect(schema.name, table.name)}
            >
              <span data-mask className="min-w-0 flex-1 truncate">
                <span className="text-muted-foreground">{schema.name}.</span>
                {table.name}
              </span>
            </Action>
          )
        }),
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

  function onResourceSelect() {
    setIsActionCenterOpen(false)
    prefetchConnectionResourceCore(connectionResource)
    router.navigate(params)
  }

  return (
    <CommandItem
      value={`${connection.name} - ${connectionResource.name}`}
      keywords={connection.label ? [connection.label] : undefined}
      onSelect={onResourceSelect}
    >
      <ConnectionIcon type={connection.type} className="size-4 shrink-0" />
      <span data-mask className="min-w-0 flex-1 truncate">
        {connection.name}
        <span className="text-muted-foreground"> - {connectionResource.name}</span>
      </span>
      {connection.label && (
        <CommandShortcut data-mask className="tracking-normal">
          {connection.label}
        </CommandShortcut>
      )}
    </CommandItem>
  )
}

function FooterHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map(key => (
        <Kbd key={key}>{key}</Kbd>
      ))}
      {label}
    </span>
  )
}

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
    e.preventDefault()
    setIsActionCenterOpen(!isOpen)
  })

  const current = data?.find(({ connectionResource }) => connectionResource.id === resourceId)

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsActionCenterOpen}>
      <Command loop className="min-h-0 flex-1 bg-transparent p-0">
        <div className="flex shrink-0 items-center gap-3 border-b px-4">
          <RiSearchLine className="size-4 shrink-0 text-muted-foreground" />
          <CommandPrimitive.Input
            data-slot="command-input"
            placeholder="Type a command or search…"
            className="
              h-12 min-w-0 flex-1 bg-transparent text-base outline-hidden
              placeholder:text-muted-foreground/60
            "
          />
        </div>
        <CommandList className="max-h-none flex-1 scroll-fade scroll-py-2 p-1">
          <CommandEmpty>No commands found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <Action
              icon={RiDashboardLine}
              value="Home"
              keywords={['dashboard']}
              onSelect={run(() => router.navigate({ to: '/' }))}
            >
              Home
            </Action>
            {current &&
              CONNECTION_PAGES.map(page => (
                <Action
                  key={page.to}
                  icon={page.icon}
                  value={`Go to ${page.label}`}
                  keywords={['go to', page.label]}
                  onSelect={run(() =>
                    router.navigate({
                      to: page.to,
                      params: { resourceId: current.connectionResource.id },
                    }),
                  )}
                >
                  Go to {page.label}
                </Action>
              ))}
            <Action
              icon={RiAddLine}
              value="Add new connection"
              keywords={['new', 'create', 'database']}
              onSelect={run(() => router.navigate({ to: '/create' }))}
            >
              Add new connection…
            </Action>
          </CommandGroup>
          <CommandGroup heading="Appearance">
            <Action
              icon={resolvedTheme === 'dark' ? RiSunLine : RiMoonLine}
              value={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
              keywords={['theme', 'dark', 'light', 'mode']}
              onSelect={run(() => themeStore.set(resolvedTheme === 'dark' ? 'light' : 'dark'))}
            >
              Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} theme
            </Action>
            <Action
              icon={RiComputerLine}
              value="Use system theme"
              keywords={['theme', 'system', 'auto']}
              onSelect={run(() => themeStore.set('system'))}
            >
              Use system theme
            </Action>
          </CommandGroup>
          <CommandGroup heading="Application">
            {current && (
              <Action
                icon={RiHistoryLine}
                value="Toggle query logger"
                keywords={['logs', 'queries', 'history']}
                onSelect={run(() => {
                  const store = getConnectionResourceStore(current.connectionResource.id)
                  store.set(
                    state =>
                      ({ ...state, loggerOpened: !state.loggerOpened }) satisfies typeof state,
                  )
                })}
              >
                Toggle query logger
              </Action>
            )}
            {!!window.electron && (
              <Action
                icon={RiDownloadLine}
                value="Check for updates"
                keywords={['update', 'version']}
                onSelect={run(() => checkForUpdates())}
              >
                Check for updates…
              </Action>
            )}
            <Action
              icon={RiRefreshLine}
              value="Reload window"
              keywords={['restart', 'refresh']}
              onSelect={() => window.location.reload()}
            >
              Reload window
            </Action>
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
            <ResourceTables
              connection={current.connection}
              connectionResource={current.connectionResource}
            />
          )}
        </CommandList>
      </Command>
      <div
        className="
          flex shrink-0 items-center gap-3 border-t px-4 py-2 text-2xs
          text-muted-foreground/70
        "
      >
        <FooterHint keys={['↑', '↓']} label="navigate" />
        <FooterHint keys={['↵']} label="open" />
        <FooterHint keys={['esc']} label="close" />
      </div>
    </CommandDialog>
  )
}
