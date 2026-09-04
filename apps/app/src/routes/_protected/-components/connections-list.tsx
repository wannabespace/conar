import {
  Alert02Icon,
  Copy01Icon,
  DatabaseIcon,
  Delete02Icon,
  Layers01Icon,
  PlusSignIcon,
  Refresh01Icon,
  SortByDown01Icon,
  SortByUp01Icon,
  SquareUnlock01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CONNECTION_RESOURCE_ROOT_LABEL,
  CONNECTION_RESOURCE_ROOT_SYMBOL,
} from '@tamery/shared/constants'
import { connectionLabels } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import { Button } from '@tamery/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { copy } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import { caseWhen, eq, useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import type { MotionStyle } from 'motion/react'
import { AnimatePresence, motion } from 'motion/react'
import type { ComponentRef } from 'react'
import { useRef } from 'react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'
import { toast } from 'sonner'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu } from '~/components/app-context-menu'
import { Link } from '~/components/link'
import { useCollections } from '~/entities/collections'
import type { Connection } from '~/entities/connection'
import {
  ConnectionIcon,
  ConnectionResourceLink,
  connectionResourcesQueryOptions,
  connectionVersionQueryOptions,
  getConnectionStore,
  lastOpenedResourcesStorageValue,
  useFetchingConfig,
} from '~/entities/connection'
import { useActiveWorkspace } from '~/entities/workspace'

import { LastOpenedResources } from './last-opened-resources'
import { RemoveConnectionDialog } from './remove-connection-dialog'

const VersionTooltipContent = ({
  canSend,
  isVersionPending,
  version,
}: {
  canSend: boolean
  isVersionPending: boolean
  version: string | undefined
}) => {
  if (!canSend) {
    return <span className="opacity-50">Version is unavailable</span>
  }
  if (isVersionPending) {
    return <span className="animate-pulse">Loading version...</span>
  }
  if (version) {
    return <div className="flex items-center gap-1">{version}</div>
  }
  return <span className="opacity-50">Version cannot be detected</span>
}

const ConnectionIconWithVersion = ({
  connection,
}: {
  connection: Connection
}) => {
  const { canSend } = useFetchingConfig(connection)
  const { data: version, isPending: isVersionPending } = useQuery({
    ...connectionVersionQueryOptions(connection),
    enabled: canSend,
  })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ConnectionIcon
            type={connection.type}
            className="pointer-events-auto size-5 shrink-0"
          />
        }
      />

      <TooltipContent
        side="left"
        className="pointer-events-auto flex items-center gap-1"
        sideOffset={10}
      >
        <span className="opacity-50">Version: </span>
        <VersionTooltipContent
          canSend={canSend}
          isVersionPending={isVersionPending}
          version={version}
        />
      </TooltipContent>
    </Tooltip>
  )
}

const ROOT_RESOURCE_VALUE =
  CONNECTION_RESOURCE_ROOT_SYMBOL.description ?? 'CONNECTION_RESOURCE_ROOT'

const resourceValue = (
  resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL
) =>
  resource === CONNECTION_RESOURCE_ROOT_SYMBOL ? ROOT_RESOURCE_VALUE : resource

const resourceLabel = (
  resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL
) =>
  resource === CONNECTION_RESOURCE_ROOT_SYMBOL
    ? CONNECTION_RESOURCE_ROOT_LABEL
    : resource

const ConnectionResourcesSelect = ({
  resources,
  selectedResourceName,
  onSelectedResourceNameChange,
  disabled,
}: {
  resources: (string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL)[]
  selectedResourceName: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null
  onSelectedResourceNameChange: (resource: string | null) => void
  disabled: boolean
}) => (
  <Select
    value={
      selectedResourceName === null
        ? undefined
        : resourceValue(selectedResourceName)
    }
    onValueChange={(value) => onSelectedResourceNameChange(value ?? null)}
    disabled={disabled}
  >
    <SelectTrigger data-mask size="xs" className="pointer-events-auto">
      <SelectValue>
        {selectedResourceName === null
          ? null
          : resourceLabel(selectedResourceName)}
      </SelectValue>
    </SelectTrigger>
    <SelectContent data-mask size="xs">
      {resources.map((resource) => (
        <SelectItem
          key={resourceValue(resource)}
          value={resourceValue(resource)}
        >
          {resourceLabel(resource)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

const buildConnectionMenuItems = ({
  canSend,
  connection,
  isPasswordPopulated,
  onClearPassword,
  onCopy,
  onRefresh,
  onRemove,
}: {
  canSend: boolean
  connection: Connection
  isPasswordPopulated?: boolean
  onClearPassword: () => void
  onCopy: () => void
  onRefresh: () => void
  onRemove: VoidFunction
}): AppMenuNode[] => [
  {
    label: 'Refresh',
    icon: (
      <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} className="size-4" />
    ),
    disabled: !canSend,
    onSelect: onRefresh,
  },
  {
    label: 'Copy connection string',
    icon: (
      <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
    ),
    onSelect: onCopy,
  },
  ...(connection.syncType === SyncType.CloudWithoutPassword
    ? ([
        {
          label: 'Clear password',
          icon: (
            <HugeiconsIcon
              icon={SquareUnlock01Icon}
              strokeWidth={2}
              className="size-4 shrink-0"
            />
          ),
          className: 'whitespace-nowrap',
          disabled: !isPasswordPopulated,
          onSelect: onClearPassword,
        },
      ] satisfies AppMenuNode[])
    : []),
  { type: 'separator' },
  {
    label: 'Remove',
    icon: (
      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
    ),
    variant: 'destructive',
    onSelect: onRemove,
  },
]

const ConnectionCardStatus = ({
  canSend,
  error,
  isLoadingVisible,
  reason,
}: {
  canSend: boolean
  error: Error | null
  isLoadingVisible: boolean
  reason: string | null
}) => {
  if (isLoadingVisible && canSend) {
    return <Spinner className="size-3 shrink-0" />
  }
  if (!canSend) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <HugeiconsIcon
              icon={Alert02Icon}
              strokeWidth={2}
              className="text-muted-foreground pointer-events-auto size-3 shrink-0"
            />
          }
        />
        <TooltipContent className="pointer-events-auto max-w-xs">
          {reason}
        </TooltipContent>
      </Tooltip>
    )
  }
  if (error) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <HugeiconsIcon
              icon={Alert02Icon}
              strokeWidth={2}
              className="text-warning pointer-events-auto size-3 shrink-0"
            />
          }
        />
        <TooltipContent className="pointer-events-auto block max-w-3xs">
          <span className="opacity-50">Failed to get resources: </span>
          <span data-mask>{error.message}</span>
        </TooltipContent>
      </Tooltip>
    )
  }
  return null
}

const ConnectionCardMeta = ({
  canSend,
  connectionStore,
  displayUrl,
  isResourcesShown,
  resources,
  selectedResourceName,
}: {
  canSend: boolean
  connectionStore: ReturnType<typeof getConnectionStore>
  displayUrl: string | undefined
  isResourcesShown: boolean
  resources: (string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL)[]
  selectedResourceName: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null
}) => (
  <div className="text-muted-foreground pointer-events-none relative z-10 flex min-w-0 shrink-0 items-center gap-2 text-xs">
    <div className="hidden max-w-52 min-w-0 items-center font-mono md:flex">
      {displayUrl ? (
        <span data-mask className="truncate">
          {displayUrl}
        </span>
      ) : (
        <Skeleton className="h-3 w-40" />
      )}
    </div>
    {isResourcesShown ? (
      <ConnectionResourcesSelect
        resources={resources}
        selectedResourceName={selectedResourceName}
        onSelectedResourceNameChange={(value) =>
          connectionStore.set(
            (state) =>
              ({
                ...state,
                lastOpenedResourceName: value,
              }) satisfies typeof state
          )
        }
        disabled={!canSend}
      />
    ) : (
      selectedResourceName !== null && (
        <span data-mask className="max-w-32 shrink-0 truncate text-xs">
          <span className="text-muted-foreground/50">/ </span>
          {resourceLabel(selectedResourceName)}
        </span>
      )
    )}
  </div>
)

const ConnectionCard = ({
  connection,
  onRemove,
}: {
  connection: Connection
  onRemove: VoidFunction
}) => {
  const { connectionStringsCollection, connectionsResourcesCollection } =
    useCollections()
  const { data: connectionString } = useLiveQuery({
    query: (q) =>
      q
        .from({ cs: connectionStringsCollection })
        .where(({ cs }) => eq(cs.connectionId, connection.id))
        .findOne(),
  })
  const { data: connectionResources } = useLiveQuery({
    query: (q) =>
      q
        .from({ cr: connectionsResourcesCollection })
        .where(({ cr }) => eq(cr.connectionId, connection.id))
        .orderBy(({ cr }) => cr.name, 'asc'),
  })

  const connectionResourcesNames = connectionResources.map(
    (r) => r.name || CONNECTION_RESOURCE_ROOT_SYMBOL
  )
  const { type: fetchType, canSend, reason } = useFetchingConfig(connection)

  const {
    data: resources = connectionResourcesNames,
    isFetching,
    error,
    refetch,
  } = useQuery({
    ...connectionResourcesQueryOptions(connection),
    enabled: canSend,
  })

  const defaultResourceName = connectionString?.defaultResourceName ?? null

  const connectionStore = getConnectionStore(connection.id)
  const selectedResourceName = useSubscription(connectionStore, {
    selector: (state) =>
      (state.lastOpenedResourceName ||
        defaultResourceName ||
        resources[0] ||
        null) as string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null,
  })
  const resolvedSelectedResourceName =
    selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL
      ? null
      : selectedResourceName
  const selectedResource = connectionResources.find(
    (r) => r.name === resolvedSelectedResourceName
  )
  const canOpenResource =
    canSend || (fetchType === 'waiting-for-password' && !!window.electron)

  const handleCopy = async () => {
    const decryptedString = await connectionStringsCollection.utils.decrypt(
      connection.id
    )

    const connectionStringToCopy = new SafeURL(decryptedString)
    connectionStringToCopy.pathname =
      selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL ||
      selectedResourceName === null
        ? ''
        : selectedResourceName

    copy(connectionStringToCopy.toString(), 'Connection string copied')
  }

  const handleClearPassword = async () => {
    const record = connectionStringsCollection.get(connection.id)
    if (!record) {
      return
    }

    const url = new SafeURL(
      await connectionStringsCollection.utils.decrypt(connection.id)
    )
    url.password = ''

    const connectionStringRecord =
      await connectionStringsCollection.utils.prepare({
        connectionId: connection.id,
        connectionString: url.toString(),
        updatedAt: record.updatedAt,
      })

    connectionStringsCollection.update(connection.id, (draft) => {
      Object.assign(draft, connectionStringRecord)
    })

    toast.success('Password cleared from this device')
  }

  const isResourcesShown = resources.length > 1
  const isLoadingVisible = isFetching && connectionResourcesNames.length === 0

  const items = buildConnectionMenuItems({
    canSend,
    connection,
    isPasswordPopulated: connectionString?.isPasswordPopulated,
    onClearPassword: handleClearPassword,
    onCopy: handleCopy,
    onRefresh: () => refetch(),
    onRemove,
  })

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      style={
        (connection.color ? { '--color': connection.color } : {}) as MotionStyle
      }
      className="relative flex flex-col border-b last:border-b-0"
    >
      <AppContextMenu
        items={items}
        contentProps={{ className: 'min-w-44' }}
        className={cn(
          'group relative flex h-9 items-center gap-3 pr-2 pl-3 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
          selectedResource &&
            canOpenResource &&
            'hover:bg-popover has-[[data-resource-link]:hover]:bg-popover'
        )}
      >
        {selectedResource && canOpenResource && (
          <ConnectionResourceLink
            resourceId={selectedResource.id}
            className="absolute inset-0 cursor-default"
            preload={false}
            data-resource-link
          />
        )}
        {connection.color && (
          <span className="pointer-events-none absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-(--color)" />
        )}
        <div
          className={cn(
            'pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3',
            isLoadingVisible && 'animate-pulse'
          )}
        >
          <ConnectionIconWithVersion connection={connection} />
          <div className="flex min-w-0 items-center gap-2">
            <span
              data-mask
              title={connection.name}
              className="truncate text-sm leading-none font-medium"
            >
              {connection.name}
            </span>
            <ConnectionCardStatus
              canSend={canSend}
              error={error}
              isLoadingVisible={isLoadingVisible}
              reason={reason}
            />
          </div>
        </div>
        <ConnectionCardMeta
          canSend={canSend}
          connectionStore={connectionStore}
          displayUrl={connectionString?.displayUrl}
          isResourcesShown={isResourcesShown}
          resources={resources}
          selectedResourceName={selectedResourceName}
        />
      </AppContextMenu>
    </motion.div>
  )
}

const GhostRow = ({
  nameWidth,
  urlWidth,
  lit = false,
  className,
}: {
  nameWidth: string
  urlWidth: string
  lit?: boolean
  className?: string
}) => (
  <div
    className={cn(
      'border-border/40 flex h-9 items-center gap-3 border-b px-3 last:border-b-0',
      className
    )}
  >
    <span
      className={cn(
        'h-4 w-0.5 shrink-0 rounded-full',
        lit ? 'bg-primary' : 'bg-muted-foreground/20'
      )}
    />
    <span className="bg-muted-foreground/15 size-4 shrink-0 rounded-md" />
    <span
      className={cn('bg-muted-foreground/15 h-2.5 rounded-full', nameWidth)}
    />
    <span className="flex-1" />
    <span
      className={cn(
        `bg-muted-foreground/10 hidden h-2 rounded-full md:block`,
        urlWidth
      )}
    />
  </div>
)

export const Empty = () => (
  <div className="flex flex-col items-center py-10 text-center">
    <div
      className="border-border/50 bg-card/40 pointer-events-none w-full max-w-md overflow-hidden rounded-xl border mask-[linear-gradient(to_bottom,black,transparent)]"
      aria-hidden
    >
      <GhostRow nameWidth="w-32" urlWidth="w-28" lit />
      <GhostRow nameWidth="w-24" urlWidth="w-36" className="opacity-70" />
      <GhostRow nameWidth="w-36" urlWidth="w-24" className="opacity-40" />
    </div>

    <div className="border-border/50 bg-card -mt-6 flex size-12 items-center justify-center rounded-xl border shadow-xs">
      <HugeiconsIcon
        icon={DatabaseIcon}
        strokeWidth={2}
        className="text-muted-foreground size-5"
      />
    </div>

    <h2 className="text-foreground mt-5 text-base font-medium">
      No connections yet
    </h2>
    <p className="text-muted-foreground mt-1 max-w-xs text-sm">
      Add a connection and it shows up here — open it in one click.
    </p>

    <Button
      className="mt-5"
      nativeButton={false}
      render={<Link to="/create" />}
    >
      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
      New connection
    </Button>
  </div>
)

const sortOptions = [
  { value: 'date-desc', label: 'Date (newest first)' },
  { value: 'date-asc', label: 'Date (oldest first)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
] as const

const sortValue = createWebStorageValue({
  type: 'localStorage',
  key: 'connections-list-sort',
  schema: type('string' as type.cast<(typeof sortOptions)[number]['value']>),
  defaultValue: 'date-desc',
})

const groupOptions = [
  { value: 'label', label: 'Group by label' },
  { value: 'type', label: 'Group by type' },
  { value: 'none', label: 'No grouping' },
] as const

const groupValue = createWebStorageValue({
  type: 'localStorage',
  key: 'connections-list-group',
  schema: type('string' as type.cast<(typeof groupOptions)[number]['value']>),
  defaultValue: 'label',
})

export const ConnectionsList = () => {
  const { connectionsCollection } = useCollections()
  const sort = useSubscription(sortValue)
  const grouping = useSubscription(groupValue)
  const { data: activeWorkspace } = useActiveWorkspace()
  const { data } = useLiveQuery({
    query: (q) => {
      let query = activeWorkspace
        ? q
            .from({ c: connectionsCollection })
            .where(({ c }) => eq(c.workspaceId, activeWorkspace.id))
        : q.from({ c: connectionsCollection })

      if (grouping === 'label') {
        query = query.orderBy(
          ({ c }) => caseWhen(eq(c.label, ''), null, c.label),
          {
            nulls: 'last',
          }
        )
      } else if (grouping === 'type') {
        query = query.orderBy(({ c }) => c.type)
      }

      const [sortField, sortDirection] = sort.split('-') as [
        'date' | 'name',
        'asc' | 'desc',
      ]
      return query.orderBy(
        ({ c }) => (sortField === 'date' ? c.createdAt : c.name),
        sortDirection
      )
    },
  })

  const removeDialogRef =
    useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)
  const lastOpenedResources = useSubscription(lastOpenedResourcesStorageValue)

  const groupTitle = (connection: Connection): string | null => {
    if (grouping === 'label') {
      return connection.label || null
    }
    if (grouping === 'type') {
      return connectionLabels[connection.type]
    }
    return null
  }
  const groups: { label: string | null; connections: Connection[] }[] = []
  for (const connection of data) {
    const label = groupTitle(connection)
    const previous = groups.at(-1)
    if (previous && previous.label === label) {
      previous.connections.push(connection)
    } else {
      groups.push({ label, connections: [connection] })
    }
  }
  const showHeaders = groups.some((group) => group.label !== null)

  const showLastOpened = lastOpenedResources.length > 0 && data.length > 1

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      {showLastOpened && <LastOpenedResources />}
      {data.length > 1 && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-2xs text-muted-foreground px-2 font-semibold tracking-wider uppercase">
            {data.length} connection{data.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={grouping}
              onValueChange={(value) => {
                if (value) {
                  groupValue.set(value)
                }
              }}
            >
              <SelectTrigger size="sm" className="shrink-0">
                <HugeiconsIcon icon={Layers01Icon} strokeWidth={2} />
                <SelectValue>
                  {groupOptions.find((option) => option.value === grouping)
                    ?.label ?? grouping}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(value) => {
                if (value) {
                  sortValue.set(value)
                }
              }}
            >
              <SelectTrigger size="sm" className="shrink-0">
                {sort.includes('asc') ? (
                  <HugeiconsIcon icon={SortByUp01Icon} strokeWidth={2} />
                ) : (
                  <HugeiconsIcon icon={SortByDown01Icon} strokeWidth={2} />
                )}
                <SelectValue>
                  {sortOptions.find((option) => option.value === sort)?.label ??
                    sort}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              className="text-foreground"
              render={<Link to="/create" />}
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                className="text-muted-foreground size-4"
              />
              New
            </Button>
          </div>
        </div>
      )}
      {data.length > 0 ? (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label ?? '__other__'} className="flex flex-col">
              {showHeaders && (
                <h3 className="text-2xs text-muted-foreground mb-1.5 px-2 font-semibold tracking-wider uppercase">
                  {group.label ?? 'Other'}
                </h3>
              )}
              <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                <AnimatePresence initial={false} mode="popLayout">
                  {group.connections.map((connection) => (
                    <ConnectionCard
                      key={connection.id}
                      connection={connection}
                      onRemove={() => {
                        removeDialogRef.current?.remove(connection)
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
          <Link
            to="/create"
            className="text-muted-foreground hover:bg-card hover:text-foreground flex h-9 cursor-default items-center justify-center gap-2 rounded-xl border border-dashed text-sm transition-colors duration-150"
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="size-4"
            />
            New connection
          </Link>
        </div>
      ) : (
        <Empty />
      )}
    </div>
  )
}
