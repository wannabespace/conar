import {
  ArrowDown02Icon,
  ArrowUp02Icon,
  ComputerIcon,
  DashboardSquare01Icon,
  DatabaseAddIcon,
  DatabaseSyncIcon,
  Moon02Icon,
  Refresh01Icon,
  Search01Icon,
  Settings02Icon,
  Sun03Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
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
import {
  EnterIcon,
  KbdCtrlLetter,
} from '@tamery/ui/components/custom/shortcuts'
import { Kbd } from '@tamery/ui/components/kbd'
import { themeStore, useResolvedTheme } from '@tamery/ui/theme-store'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useHotkey } from '@tanstack/react-hotkeys'
import { skipToken, useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import type { ComponentRef, ReactNode } from 'react'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { tableTypeIcon } from '~/core/catalog/table-type'
import { useCollections } from '~/core/collections'
import { ConnectionIcon } from '~/core/connection/connection-icon'
import { prefetchConnectionResourceCore } from '~/core/connection/fetching'
import type { Connection, ConnectionResource } from '~/core/connection/sync'
import { useConnectionResourceLinkParams } from '~/core/connection/use-connection-resource-link-params'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { settingsSections } from '~/core/settings/sections'
import { openTab } from '~/core/tabs/actions'
import { tableTabId } from '~/core/tabs/ids'
import { checkOrUpgrade } from '~/core/user/permissions'
import { useActiveWorkspace } from '~/core/workspace/hooks'
import { globalHooks } from '~/lib/global-hooks'
import type { CommandEntry } from '~/lib/module'
import { appModules, byOrder } from '~/lib/modules'
import { posthog } from '~/lib/posthog'
import { protectedModules } from '~/lib/protected-modules'

import { actionCenterOpen } from './action-center-open'

const REFRESH_SHORTCUT_LETTER = window.electron ? 'R' : undefined

const run = (action: () => void) => () => {
  actionCenterOpen.set(false)
  action()
}

const actionEntry = (
  value: string,
  keywords: string[],
  Icon: IconSvgElement,
  action: () => void,
  shortcutLetter?: string
) => ({
  keywords,
  node: (
    <CommandItem
      key={value}
      value={value}
      onSelect={run(() => {
        posthog.capture('command_run', { command: value })
        action()
      })}
    >
      <HugeiconsIcon icon={Icon} strokeWidth={2} />
      {value}
      {shortcutLetter && (
        <KbdCtrlLetter
          className="ml-auto"
          userAgent={navigator.userAgent}
          letter={shortcutLetter}
        />
      )}
    </CommandItem>
  ),
  value,
})

const resourceName = (connectionResource: ConnectionResource) =>
  connectionResource.name || CONNECTION_RESOURCE_ROOT_LABEL

const connectionTitle = (
  connection: Connection,
  connectionResource: ConnectionResource
) => `${connection.name} - ${resourceName(connectionResource)}`

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
      value={connectionTitle(connection, connectionResource)}
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
          - {resourceName(connectionResource)}
        </span>
      </span>
      {connection.label && (
        <CommandShortcut data-mask>{connection.label}</CommandShortcut>
      )}
    </CommandItem>
  )
}

const tableEntries = (
  router: ReturnType<typeof useRouter>,
  resourceId: string,
  schemas: {
    name: string
    tables: { name: string; type: keyof typeof tableTypeIcon }[]
  }[]
) =>
  schemas.flatMap((schema) =>
    schema.tables.map((table) => {
      const value = `${schema.name}.${table.name}`
      const Icon = tableTypeIcon[table.type]

      return {
        keywords: [schema.name, table.name],
        node: (
          <CommandItem
            key={value}
            value={value}
            onSelect={run(() =>
              router.navigate({
                params: {
                  resourceId,
                  tabId: openTab(
                    resourceId,
                    tableTabId(schema.name, table.name)
                  ),
                },
                to: '/connection/$resourceId/$tabId',
              })
            )}
          >
            <HugeiconsIcon icon={Icon} strokeWidth={2} />
            <span data-mask className="min-w-0 flex-1 truncate">
              <span className="text-muted-foreground">{schema.name}.</span>
              {table.name}
            </span>
          </CommandItem>
        ),
        value,
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
  const { resourceId, tabId } = useParams({ strict: false })
  const { data: activeWorkspace } = useActiveWorkspace()
  const { data } = useLiveQuery({
    query: (q) => {
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
  })

  const isOpen = useSubscription(actionCenterOpen)
  const router = useRouter()
  const resolvedTheme = useResolvedTheme()
  const [search, setSearch] = useState('')
  if (!isOpen && search) {
    setSearch('')
  }
  const listRef = useRef<ComponentRef<typeof CommandList>>(null)

  useHotkey('Mod+P', (e) => {
    e.preventDefault()
    actionCenterOpen.set(!isOpen)
  })

  const current = data.find(
    ({ connectionResource }) => connectionResource.id === resourceId
  )

  const { data: tablesAndSchemas } = useQuery({
    ...(current
      ? resourceTablesAndSchemasQueryOptions({
          connectionResource: current.connectionResource,
        })
      : { queryFn: skipToken, queryKey: ['actions-center-tables-none'] }),
    throwOnError: false,
  })

  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
  const moduleEntries = protectedModules.commands({ current, tabId })
  const entriesIn = (
    group: CommandEntry['group'],
    coreEntries: CommandEntry[] = []
  ) =>
    byOrder([...moduleEntries, ...coreEntries])
      .filter((entry) => entry.group === group)
      .map((entry) =>
        actionEntry(
          entry.value,
          entry.keywords,
          entry.icon,
          entry.action,
          entry.shortcut
        )
      )

  const connections = data.map(({ connection, connectionResource }) => ({
    keywords: connection.label ? [connection.label] : undefined,
    node: (
      <ConnectionItem
        key={connectionResource.id}
        connection={connection}
        connectionResource={connectionResource}
      />
    ),
    value: connectionTitle(connection, connectionResource),
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
      entries: [
        actionEntry('Home', ['dashboard'], DashboardSquare01Icon, () =>
          router.navigate({ to: '/' })
        ),
        ...(current
          ? [
              ...appModules.newTabActions.map((action) =>
                actionEntry(
                  action.label,
                  ['open', 'go to', ...action.keywords, action.label],
                  action.icon,
                  () =>
                    router.navigate({
                      params: {
                        resourceId: current.connectionResource.id,
                        tabId: action.open(current.connectionResource.id),
                      },
                      to: '/connection/$resourceId/$tabId',
                    })
                )
              ),
              ...appModules
                .schemaGroups(current.connection.type)
                .flatMap((group) => group.items)
                .map((item) =>
                  actionEntry(
                    item.label,
                    ['open', 'go to', item.group, 'definitions'],
                    item.icon,
                    () =>
                      router.navigate({
                        params: {
                          resourceId: current.connectionResource.id,
                          tabId: openTab(
                            current.connectionResource.id,
                            item.tabId
                          ),
                        },
                        to: '/connection/$resourceId/$tabId',
                      })
                  )
                ),
            ]
          : []),
        ...entriesIn('Navigation'),
      ],
      heading: 'Navigation',
    },
    {
      entries: entriesIn(
        'Database',
        current
          ? [
              {
                action: () => globalHooks.callHook('refreshPressed'),
                group: 'Database',
                icon: DatabaseSyncIcon,
                keywords: ['reload', 'refetch', 'update'],
                order: 30,
                shortcut: REFRESH_SHORTCUT_LETTER,
                value: 'Refresh data',
              },
            ]
          : []
      ),
      heading: 'Database',
    },
    { entries: entriesIn('View'), heading: 'View' },
    {
      entries: [
        actionEntry(
          `Switch to ${nextTheme} theme`,
          ['theme', 'dark', 'light', 'mode'],
          resolvedTheme === 'dark' ? Sun03Icon : Moon02Icon,
          () => themeStore.set(nextTheme)
        ),
        actionEntry(
          'Use system theme',
          ['theme', 'system', 'auto'],
          ComputerIcon,
          () => themeStore.set('system')
        ),
      ],
      heading: 'Appearance',
    },
    {
      entries: [
        ...entriesIn('Application'),
        actionEntry(
          'Settings',
          ['preferences', 'options'],
          Settings02Icon,
          () => router.navigate({ to: '/settings/{-$section}' }),
          ','
        ),
        ...settingsSections().map(({ icon, id, label }) =>
          actionEntry(
            `${label} settings`,
            ['settings', 'preferences', 'options'],
            icon,
            () =>
              router.navigate({
                params: { section: id },
                to: '/settings/{-$section}',
              })
          )
        ),
        actionEntry(
          'Reload window',
          ['restart', 'refresh'],
          Refresh01Icon,
          () => window.location.reload()
        ),
      ],
      heading: 'Application',
    },
    {
      entries: [
        actionEntry(
          'Add new connection…',
          ['new', 'create', 'database'],
          DatabaseAddIcon,
          () =>
            checkOrUpgrade('connection.create', {
              count: connectionsCollection.size,
            }) && router.navigate({ to: '/create' })
        ),
        ...connections,
      ],
      heading: 'Connections',
    },
    ...(current && tables.length > 0
      ? [
          {
            entries: tables,
            heading: `${connectionTitle(current.connection, current.connectionResource)} Tables`,
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

  let listContent: ReactNode = sections
    .filter((section) => section.entries.length > 0)
    .map((section) => (
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
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => actionCenterOpen.set(open)}
    >
      <Command
        variant="transparent"
        loop
        shouldFilter={false}
        className="min-h-0 flex-1"
      >
        <div className="flex shrink-0 items-center gap-3 border-b px-4">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="text-muted-foreground size-4 shrink-0"
          />
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
          className="scroll-fade max-h-none flex-1 scroll-py-2"
        >
          <div className="p-1">{listContent}</div>
        </CommandList>
      </Command>
      <div className="text-2xs text-muted-foreground/70 flex shrink-0 items-center gap-3 border-t px-4 py-2">
        <FooterHint label="navigate">
          <Kbd>
            <HugeiconsIcon
              icon={ArrowUp02Icon}
              strokeWidth={2}
              className="size-3"
            />
          </Kbd>
          <Kbd>
            <HugeiconsIcon
              icon={ArrowDown02Icon}
              strokeWidth={2}
              className="size-3"
            />
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
