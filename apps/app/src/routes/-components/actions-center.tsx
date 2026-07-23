import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowUpLine,
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
  CommandGroup,
  CommandItem,
  CommandList,
  CommandPrimitive,
  CommandShortcut,
  defaultFilter,
} from '@tamery/ui/components/command'
import { EnterIcon } from '@tamery/ui/components/custom/shortcuts'
import { Kbd } from '@tamery/ui/components/kbd'
import { themeStore, useResolvedTheme } from '@tamery/ui/theme-store'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useHotkey } from '@tanstack/react-hotkeys'
import { skipToken, useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import type { ComponentRef, ReactNode } from 'react'
import { useMemo, useRef, useState } from 'react'
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
  { label: 'SQL Runner', to: '/connection/$resourceId/query' as const, icon: RiTerminalBoxLine },
  { label: 'Tables', to: '/connection/$resourceId/table' as const, icon: RiTableLine },
  {
    label: 'Definitions',
    to: '/connection/$resourceId/definitions' as const,
    icon: RiFileListLine,
  },
  { label: 'Visualizer', to: '/connection/$resourceId/visualizer' as const, icon: RiNodeTree },
]

const TABLE_TYPE_ICONS = {
  'materialized view': RiEyeFill,
  'view': RiEyeLine,
  'table': RiTableLine,
} as const

interface CommandEntry {
  value: string
  keywords?: string[]
  node: ReactNode
}

interface CommandSection {
  heading: string
  entries: CommandEntry[]
}

function run(action: () => void) {
  return () => {
    setIsActionCenterOpen(false)
    action()
  }
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

function FooterHint({ keys, label }: { keys: ReactNode[]; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((key, index) => (
        // oxlint-disable-next-line react/no-array-index-key
        <Kbd key={index}>{key}</Kbd>
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
  const [search, setSearch] = useState('')
  const listRef = useRef<ComponentRef<typeof CommandList>>(null)

  useHotkey('Mod+P', e => {
    e.preventDefault()
    setIsActionCenterOpen(!isOpen)
  })

  const current = data?.find(({ connectionResource }) => connectionResource.id === resourceId)

  const { data: tablesAndSchemas } = useQuery({
    ...(current
      ? resourceTablesAndSchemasQueryOptions({
          connectionResource: current.connectionResource,
          showSystem: getConnectionResourceStore(current.connectionResource.id).get().showSystem,
        })
      : { queryKey: ['actions-center-tables-none'], queryFn: skipToken }),
    throwOnError: false,
  })

  const sections = useMemo<CommandSection[]>(() => {
    const navigation: CommandEntry[] = [
      {
        value: 'Home',
        keywords: ['dashboard'],
        node: (
          <CommandItem key="Home" value="Home" onSelect={run(() => router.navigate({ to: '/' }))}>
            <RiDashboardLine className="text-muted-foreground" />
            Home
          </CommandItem>
        ),
      },
      ...(current
        ? CONNECTION_PAGES.map(page => ({
            value: `Go to ${page.label}`,
            keywords: ['go to', page.label],
            node: (
              <CommandItem
                key={page.to}
                value={`Go to ${page.label}`}
                onSelect={run(() =>
                  router.navigate({
                    to: page.to,
                    params: { resourceId: current.connectionResource.id },
                  }),
                )}
              >
                <page.icon className="text-muted-foreground" />
                Go to {page.label}
              </CommandItem>
            ),
          }))
        : []),
      {
        value: 'Add new connection',
        keywords: ['new', 'create', 'database'],
        node: (
          <CommandItem
            key="Add new connection"
            value="Add new connection"
            onSelect={run(() => router.navigate({ to: '/create' }))}
          >
            <RiAddLine className="text-muted-foreground" />
            Add new connection…
          </CommandItem>
        ),
      },
    ]

    const appearance: CommandEntry[] = [
      {
        value: `Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`,
        keywords: ['theme', 'dark', 'light', 'mode'],
        node: (
          <CommandItem
            key="switch-theme"
            value={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
            onSelect={run(() => themeStore.set(resolvedTheme === 'dark' ? 'light' : 'dark'))}
          >
            {resolvedTheme === 'dark' ? (
              <RiSunLine className="text-muted-foreground" />
            ) : (
              <RiMoonLine className="text-muted-foreground" />
            )}
            Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} theme
          </CommandItem>
        ),
      },
      {
        value: 'Use system theme',
        keywords: ['theme', 'system', 'auto'],
        node: (
          <CommandItem
            key="system-theme"
            value="Use system theme"
            onSelect={run(() => themeStore.set('system'))}
          >
            <RiComputerLine className="text-muted-foreground" />
            Use system theme
          </CommandItem>
        ),
      },
    ]

    const application: CommandEntry[] = [
      ...(current
        ? [
            {
              value: 'Toggle query logger',
              keywords: ['logs', 'queries', 'history'],
              node: (
                <CommandItem
                  key="query-logger"
                  value="Toggle query logger"
                  onSelect={run(() => {
                    const store = getConnectionResourceStore(current.connectionResource.id)
                    store.set(
                      state =>
                        ({ ...state, loggerOpened: !state.loggerOpened }) satisfies typeof state,
                    )
                  })}
                >
                  <RiHistoryLine className="text-muted-foreground" />
                  Toggle query logger
                </CommandItem>
              ),
            },
          ]
        : []),
      ...(window.electron
        ? [
            {
              value: 'Check for updates',
              keywords: ['update', 'version'],
              node: (
                <CommandItem
                  key="check-updates"
                  value="Check for updates"
                  onSelect={run(() => checkForUpdates())}
                >
                  <RiDownloadLine className="text-muted-foreground" />
                  Check for updates…
                </CommandItem>
              ),
            },
          ]
        : []),
      {
        value: 'Reload window',
        keywords: ['restart', 'refresh'],
        node: (
          <CommandItem
            key="reload-window"
            value="Reload window"
            onSelect={() => window.location.reload()}
          >
            <RiRefreshLine className="text-muted-foreground" />
            Reload window
          </CommandItem>
        ),
      },
    ]

    const connections: CommandEntry[] = data.map(({ connection, connectionResource }) => ({
      value: `${connection.name} - ${connectionResource.name}`,
      keywords: connection.label ? [connection.label] : undefined,
      node: (
        <ConnectionResource
          key={connectionResource.id}
          connection={connection}
          connectionResource={connectionResource}
        />
      ),
    }))

    const tables: CommandEntry[] = (tablesAndSchemas?.schemas ?? []).flatMap(schema =>
      schema.tables.map(table => {
        const Icon = TABLE_TYPE_ICONS[table.type as keyof typeof TABLE_TYPE_ICONS] ?? RiTableLine

        return {
          value: `${schema.name}.${table.name}`,
          keywords: [schema.name, table.name],
          node: (
            <CommandItem
              key={`${schema.name}.${table.name}`}
              value={`${schema.name}.${table.name}`}
              onSelect={run(() =>
                router.navigate({
                  to: '/connection/$resourceId/table',
                  params: { resourceId: current!.connectionResource.id },
                  search: { schema: schema.name, table: table.name },
                }),
              )}
            >
              <Icon className="text-muted-foreground" />
              <span data-mask className="min-w-0 flex-1 truncate">
                <span className="text-muted-foreground">{schema.name}.</span>
                {table.name}
              </span>
            </CommandItem>
          ),
        }
      }),
    )

    return [
      { heading: 'Navigation', entries: navigation },
      { heading: 'Appearance', entries: appearance },
      { heading: 'Application', entries: application },
      ...(connections.length > 0 ? [{ heading: 'Connections', entries: connections }] : []),
      ...(current && tables.length > 0
        ? [
            {
              heading: `${current.connection.name} - ${current.connectionResource.name || CONNECTION_RESOURCE_ROOT_LABEL} Tables`,
              entries: tables,
            },
          ]
        : []),
    ]
  }, [current, data, tablesAndSchemas, resolvedTheme, router])

  const results = useMemo(() => {
    if (!search.trim()) {
      return null
    }

    return sections
      .flatMap(section => section.entries)
      .map(entry => ({ entry, score: defaultFilter(entry.value, search, entry.keywords) }))
      .filter(result => result.score > 0)
      .toSorted((a, b) => b.score - a.score)
  }, [search, sections])

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsActionCenterOpen}>
      <Command loop shouldFilter={false} className="min-h-0 flex-1 bg-transparent p-0">
        <div className="flex shrink-0 items-center gap-3 border-b px-4">
          <RiSearchLine className="size-4 shrink-0 text-muted-foreground" />
          <CommandPrimitive.Input
            data-slot="command-input"
            placeholder="Type a command or search…"
            className="
              h-12 min-w-0 flex-1 bg-transparent text-base outline-hidden
              placeholder:text-muted-foreground/60
            "
            value={search}
            onValueChange={value => {
              setSearch(value)
              listRef.current?.scrollTo({ top: 0 })
            }}
          />
        </div>
        <CommandList ref={listRef} className="max-h-none flex-1 scroll-fade scroll-py-2 p-1">
          {results === null ? (
            sections.map(section => (
              <CommandGroup key={section.heading} heading={section.heading}>
                {section.entries.map(entry => entry.node)}
              </CommandGroup>
            ))
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm">No commands found.</div>
          ) : (
            <CommandGroup>{results.map(result => result.entry.node)}</CommandGroup>
          )}
        </CommandList>
      </Command>
      <div
        className="
          flex shrink-0 items-center gap-3 border-t px-4 py-2 text-2xs
          text-muted-foreground/70
        "
      >
        <FooterHint
          keys={[
            <RiArrowUpLine key="up" className="size-3" />,
            <RiArrowDownLine key="down" className="size-3" />,
          ]}
          label="navigate"
        />
        <FooterHint keys={[<EnterIcon key="enter" />]} label="open" />
        <FooterHint keys={['esc']} label="close" />
      </div>
    </CommandDialog>
  )
}
