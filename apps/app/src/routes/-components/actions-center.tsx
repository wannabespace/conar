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
import type { RemixiconComponentType } from '@remixicon/react'
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
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { useCollections } from '~/entities/collections'
import type { Connection, ConnectionResource } from '~/entities/connection'
import {
  ConnectionIcon,
  getConnectionResourceStore,
  prefetchConnectionResourceCore,
  resourceTablesAndSchemasQueryOptions,
  useConnectionResourceLinkParams,
} from '~/entities/connection'
import {
  openDefinitionsTab,
  openRunnerTab,
  openTableTab,
  openVisualizerTab,
} from '~/entities/connection/store'
import { useActiveWorkspace } from '~/entities/workspace'
import { appStore, setIsActionCenterOpen } from '~/store'
import { checkForUpdates } from '~/use-updates-observer'

const CONNECTION_PAGES = [
  {
    label: 'SQL Runner',
    icon: RiTerminalBoxLine,
    openTab: openRunnerTab,
  },
  {
    label: 'Definitions',
    icon: RiFileListLine,
    openTab: (resourceId: string) => openDefinitionsTab(resourceId, 'enums'),
  },
  {
    label: 'Visualizer',
    icon: RiNodeTree,
    openTab: openVisualizerTab,
  },
]

const TABLE_TYPE_ICONS = {
  'materialized view': RiEyeFill,
  view: RiEyeLine,
  table: RiTableLine,
} as const

const run = (action: () => void) => () => {
  setIsActionCenterOpen(false)
  action()
}

const actionEntry = (
  value: string,
  keywords: string[],
  Icon: RemixiconComponentType,
  action: () => void
) => ({
  value,
  keywords,
  node: (
    <CommandItem key={value} value={value} onSelect={run(action)}>
      <Icon className="text-muted-foreground" />
      {value}
    </CommandItem>
  ),
})

const ConnectionItem = ({
  connection,
  connectionResource,
}: {
  connection: Connection
  connectionResource: ConnectionResource
}) => {
  const router = useRouter()
  const params = useConnectionResourceLinkParams(connectionResource.id)

  return (
    <CommandItem
      value={`${connection.name} - ${connectionResource.name}`}
      onSelect={run(() => {
        prefetchConnectionResourceCore(connectionResource)
        router.navigate(params)
      })}
    >
      <ConnectionIcon type={connection.type} className="size-4 shrink-0" />
      <span data-mask className="min-w-0 flex-1 truncate">
        {connection.name}
        <span className="text-muted-foreground">
          {' '}
          - {connectionResource.name}
        </span>
      </span>
      {connection.label && (
        <CommandShortcut data-mask className="tracking-normal">
          {connection.label}
        </CommandShortcut>
      )}
    </CommandItem>
  )
}

const tableEntries = (
  router: ReturnType<typeof useRouter>,
  resourceId: string,
  schemas: { name: string; tables: { name: string; type: string }[] }[]
) =>
  schemas.flatMap((schema) =>
    schema.tables.map((table) => {
      const value = `${schema.name}.${table.name}`
      const Icon =
        TABLE_TYPE_ICONS[table.type as keyof typeof TABLE_TYPE_ICONS] ??
        RiTableLine

      return {
        value,
        keywords: [schema.name, table.name],
        node: (
          <CommandItem
            key={value}
            value={value}
            onSelect={run(() =>
              router.navigate({
                to: '/connection/$resourceId/$tabId',
                params: {
                  resourceId,
                  tabId: openTableTab(resourceId, schema.name, table.name),
                },
              })
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
    })
  )

const FooterHint = ({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) => (
  <span className="flex items-center gap-1">
    {children}
    {label}
  </span>
)

export const ActionsCenter = () => {
  const { connectionsCollection, connectionsResourcesCollection } =
    useCollections()
  const { resourceId } = useParams({ strict: false })
  const { data: activeWorkspace } = useActiveWorkspace()
  const { data } = useLiveQuery(
    (q) => {
      const query = activeWorkspace
        ? q
            .from({ connections: connectionsCollection })
            .where(({ connections }) =>
              eq(connections.workspaceId, activeWorkspace.id)
            )
        : q.from({ connections: connectionsCollection })

      return query
        .innerJoin(
          { connectionResources: connectionsResourcesCollection },
          ({ connectionResources, connections }) =>
            eq(connectionResources.connectionId, connections.id)
        )
        .select(({ connections, connectionResources }) => ({
          connection: connections,
          connectionResource: connectionResources,
        }))
        .orderBy(({ connections }) => connections.createdAt, 'desc')
    },
    [connectionsCollection, connectionsResourcesCollection, activeWorkspace?.id]
  )

  const isOpen = useSubscription(appStore, {
    selector: (state) => state.isActionCenterOpen,
  })
  const router = useRouter()
  const resolvedTheme = useResolvedTheme()
  const [search, setSearch] = useState('')
  const listRef = useRef<ComponentRef<typeof CommandList>>(null)

  useHotkey('Mod+P', (e) => {
    e.preventDefault()
    setIsActionCenterOpen(!isOpen)
  })

  const current = data.find(
    ({ connectionResource }) => connectionResource.id === resourceId
  )

  const { data: tablesAndSchemas } = useQuery({
    ...(current
      ? resourceTablesAndSchemasQueryOptions({
          connectionResource: current.connectionResource,
          showSystem: getConnectionResourceStore(
            current.connectionResource.id
          ).get().showSystem,
        })
      : { queryKey: ['actions-center-tables-none'], queryFn: skipToken }),
    throwOnError: false,
  })

  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  const connections = data.map(({ connection, connectionResource }) => ({
    value: `${connection.name} - ${connectionResource.name}`,
    keywords: connection.label ? [connection.label] : undefined,
    node: (
      <ConnectionItem
        key={connectionResource.id}
        connection={connection}
        connectionResource={connectionResource}
      />
    ),
  }))

  const tables = current
    ? tableEntries(
        router,
        current.connectionResource.id,
        tablesAndSchemas?.schemas ?? []
      )
    : []

  const sections = [
    {
      heading: 'Navigation',
      entries: [
        actionEntry('Home', ['dashboard'], RiDashboardLine, () =>
          router.navigate({ to: '/' })
        ),
        ...(current
          ? CONNECTION_PAGES.map((page) =>
              actionEntry(
                `Open ${page.label}`,
                ['open', 'go to', page.label],
                page.icon,
                () =>
                  router.navigate({
                    to: '/connection/$resourceId/$tabId',
                    params: {
                      resourceId: current.connectionResource.id,
                      tabId: page.openTab(current.connectionResource.id),
                    },
                  })
              )
            )
          : []),
        actionEntry(
          'Add new connection…',
          ['new', 'create', 'database'],
          RiAddLine,
          () => router.navigate({ to: '/create' })
        ),
      ],
    },
    {
      heading: 'Appearance',
      entries: [
        actionEntry(
          `Switch to ${nextTheme} theme`,
          ['theme', 'dark', 'light', 'mode'],
          resolvedTheme === 'dark' ? RiSunLine : RiMoonLine,
          () => themeStore.set(nextTheme)
        ),
        actionEntry(
          'Use system theme',
          ['theme', 'system', 'auto'],
          RiComputerLine,
          () => themeStore.set('system')
        ),
      ],
    },
    {
      heading: 'Application',
      entries: [
        ...(current
          ? [
              actionEntry(
                'Toggle query logger',
                ['logs', 'queries', 'history'],
                RiHistoryLine,
                () =>
                  getConnectionResourceStore(current.connectionResource.id).set(
                    (state) => ({
                      ...state,
                      loggerOpened: !state.loggerOpened,
                    })
                  )
              ),
            ]
          : []),
        ...(window.electron
          ? [
              actionEntry(
                'Check for updates…',
                ['update', 'version'],
                RiDownloadLine,
                checkForUpdates
              ),
            ]
          : []),
        actionEntry(
          'Reload window',
          ['restart', 'refresh'],
          RiRefreshLine,
          () => window.location.reload()
        ),
      ],
    },
    ...(connections.length > 0
      ? [{ heading: 'Connections', entries: connections }]
      : []),
    ...(current && tables.length > 0
      ? [
          {
            heading: `${current.connection.name} - ${current.connectionResource.name || CONNECTION_RESOURCE_ROOT_LABEL} Tables`,
            entries: tables,
          },
        ]
      : []),
  ]

  const results = search.trim()
    ? sections
        .flatMap((section) => section.entries)
        .map((entry) => ({
          entry,
          score: defaultFilter(entry.value, search, entry.keywords),
        }))
        .filter((result) => result.score > 0)
        .toSorted((a, b) => b.score - a.score)
    : null

  let listContent: ReactNode = sections.map((section) => (
    <CommandGroup key={section.heading} heading={section.heading}>
      {section.entries.map((entry) => entry.node)}
    </CommandGroup>
  ))
  if (results) {
    listContent =
      results.length > 0 ? (
        <CommandGroup>
          {results.map((result) => result.entry.node)}
        </CommandGroup>
      ) : (
        <div className="py-6 text-center text-sm">No commands found.</div>
      )
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsActionCenterOpen}>
      <Command
        loop
        shouldFilter={false}
        className="min-h-0 flex-1 bg-transparent p-0"
      >
        <div className="flex shrink-0 items-center gap-3 border-b px-4">
          <RiSearchLine className="text-muted-foreground size-4 shrink-0" />
          <CommandPrimitive.Input
            data-slot="command-input"
            placeholder="Type a command or search…"
            className="placeholder:text-muted-foreground/60 h-12 min-w-0 flex-1 bg-transparent text-base outline-hidden"
            value={search}
            onValueChange={(value) => {
              setSearch(value)
              listRef.current?.scrollTo({ top: 0 })
            }}
          />
        </div>
        <CommandList
          ref={listRef}
          className="scroll-fade max-h-none flex-1 scroll-py-2 p-1"
        >
          {listContent}
        </CommandList>
      </Command>
      <div className="text-2xs text-muted-foreground/70 flex shrink-0 items-center gap-3 border-t px-4 py-2">
        <FooterHint label="navigate">
          <Kbd>
            <RiArrowUpLine className="size-3" />
          </Kbd>
          <Kbd>
            <RiArrowDownLine className="size-3" />
          </Kbd>
        </FooterHint>
        <FooterHint label="open">
          <Kbd>
            <EnterIcon />
          </Kbd>
        </FooterHint>
        <FooterHint label="close">
          <Kbd>esc</Kbd>
        </FooterHint>
      </div>
    </CommandDialog>
  )
}
