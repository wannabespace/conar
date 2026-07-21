import {
  RiAddLine,
  RiAlertLine,
  RiCheckLine,
  RiDatabase2Line,
  RiDeleteBinLine,
  RiExpandUpDownLine,
  RiFileCopyLine,
  RiLockUnlockLine,
  RiPushpinFill,
  RiPushpinLine,
  RiRefreshLine,
  RiSortAsc,
  RiSortDesc,
  RiStackLine,
  RiUnpinLine,
} from '@remixicon/react'
import {
  CONNECTION_RESOURCE_ROOT_LABEL,
  CONNECTION_RESOURCE_ROOT_SYMBOL,
} from '@tamery/shared/constants'
import { connectionLabels } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import { Button } from '@tamery/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@tamery/ui/components/command'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@tamery/ui/components/context-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@tamery/ui/components/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { Spinner } from '@tamery/ui/components/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { copy } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type } from 'arktype'
import { AnimatePresence, motion } from 'motion/react'
import type { ComponentRef } from 'react'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'
import { toast } from 'sonner'

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

import { LastOpenedResources } from './last-opened-resources'
import { RemoveConnectionDialog } from './remove-connection-dialog'

function ConnectionIconWithVersion({ connection }: { connection: Connection }) {
  const { canSend } = useFetchingConfig(connection)
  const {
    data: version,
    isPending: isVersionPending,
    refetch: refetchVersion,
    isRefetching: isVersionRefetching,
  } = useQuery({
    ...connectionVersionQueryOptions(connection),
    enabled: canSend,
  })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ConnectionIcon type={connection.type} className="pointer-events-auto size-6 shrink-0" />
        }
      />

      <TooltipContent
        side="left"
        className="pointer-events-auto flex items-center gap-1"
        sideOffset={10}
      >
        <span className="opacity-50">Version: </span>
        {!canSend ? (
          <span className="opacity-50">Unavailable in web app</span>
        ) : isVersionPending ? (
          <span className="animate-pulse">Loading version...</span>
        ) : version ? (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => refetchVersion()}>
              {version}
            </button>
            {isVersionRefetching && <Spinner className="size-3" />}
          </div>
        ) : (
          <span className="opacity-50">Version cannot be detected</span>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

function resourceValue(resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL) {
  return resource === CONNECTION_RESOURCE_ROOT_SYMBOL
    ? CONNECTION_RESOURCE_ROOT_SYMBOL.description!
    : resource
}

function resourceLabel(resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL) {
  return resource === CONNECTION_RESOURCE_ROOT_SYMBOL ? CONNECTION_RESOURCE_ROOT_LABEL : resource
}

// Micro-label group headings (PINNED / OTHER) — overrides the kit's default heading style
const resourceGroupClassName = `
  p-0
  not-first:mt-1
  **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pt-1.5
  **:[[cmdk-group-heading]]:pb-0.5 **:[[cmdk-group-heading]]:text-2xs
  **:[[cmdk-group-heading]]:font-semibold
  **:[[cmdk-group-heading]]:tracking-wider
  **:[[cmdk-group-heading]]:uppercase
`

function ResourceRow({
  resource,
  isPinned,
  isSelected,
  onSelect,
  onPinToggle,
}: {
  resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL
  isPinned: boolean
  isSelected: boolean
  onSelect: VoidFunction
  onPinToggle: VoidFunction
}) {
  return (
    <CommandItem
      value={resourceValue(resource)}
      keywords={[resourceLabel(resource)]}
      className="h-7 gap-2 py-0 pr-1 pl-2 text-sm"
      onSelect={onSelect}
    >
      {/* Left state column, like NSMenu — space always reserved so names align */}
      <RiCheckLine
        className={cn('size-3.5 shrink-0', isSelected ? 'text-foreground' : 'opacity-0')}
      />
      <RiDatabase2Line className="size-3.5 shrink-0 text-muted-foreground/70" />
      <span className={cn('min-w-0 flex-1 truncate', isSelected && 'font-medium')}>
        {resourceLabel(resource)}
      </span>
      {/* CommandShortcut slot hides the kit's built-in trailing check */}
      <CommandShortcut className="flex tracking-normal">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={isPinned ? 'Unpin' : 'Pin'}
                className={cn(
                  'group/pin shrink-0 hover:bg-foreground/10',
                  // Reveal follows cmdk selection so keyboard navigation shows it too
                  !isPinned &&
                    `
                    opacity-0
                    group-data-selected/command-item:opacity-100
                  `,
                )}
                onClick={e => {
                  e.stopPropagation()
                  onPinToggle()
                }}
              />
            }
          >
            {isPinned ? (
              <>
                <RiPushpinFill className="size-3.5 text-primary group-hover/pin:hidden" />
                <RiUnpinLine
                  className="
                    hidden size-3.5 text-foreground
                    group-hover/pin:block
                  "
                />
              </>
            ) : (
              <RiPushpinLine
                className="
                  size-3.5 text-muted-foreground
                  group-hover/pin:text-foreground
                "
              />
            )}
          </TooltipTrigger>
          <TooltipContent side="right">{isPinned ? 'Unpin' : 'Pin'}</TooltipContent>
        </Tooltip>
      </CommandShortcut>
    </CommandItem>
  )
}

function ConnectionResourcesCombobox({
  resources,
  selectedResourceName,
  onSelectedResourceNameChange,
  pinnedResourcesNames,
  onPinnedResourceNameChange,
  disabled,
}: {
  resources: (string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL)[]
  selectedResourceName: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null
  onSelectedResourceNameChange: (resource: string | null) => void
  pinnedResourcesNames: (string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL)[]
  onPinnedResourceNameChange: (resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL) => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)

  const pinned = resources.filter(resource => pinnedResourcesNames.includes(resource))
  const unpinned = resources.filter(resource => !pinnedResourcesNames.includes(resource))
  const hasSearch = resources.length >= 8
  const hasGroups = pinned.length > 0

  function renderItem(resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL) {
    return (
      <ResourceRow
        key={resourceValue(resource)}
        resource={resource}
        isPinned={pinnedResourcesNames.includes(resource)}
        isSelected={resource === selectedResourceName}
        onSelect={() => {
          onSelectedResourceNameChange(resourceValue(resource))
          setOpen(false)
        }}
        onPinToggle={() => onPinnedResourceNameChange(resource)}
      />
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="xs"
            disabled={disabled}
            className="pointer-events-auto gap-1 text-xs"
          />
        }
      >
        {selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL
          ? CONNECTION_RESOURCE_ROOT_LABEL
          : selectedResourceName}
        <RiExpandUpDownLine className="size-3 text-muted-foreground/70" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          'pointer-events-auto overflow-hidden p-0',
          hasSearch ? 'w-56' : 'w-auto min-w-44',
        )}
      >
        <Command>
          {hasSearch && <CommandInput placeholder="Search resources..." />}
          <CommandList className="p-1">
            <CommandEmpty>No results found.</CommandEmpty>
            {hasGroups ? (
              <>
                <CommandGroup heading="Pinned" className={resourceGroupClassName}>
                  {pinned.map(renderItem)}
                </CommandGroup>
                {unpinned.length > 0 && (
                  <CommandGroup heading="Other" className={resourceGroupClassName}>
                    {unpinned.map(renderItem)}
                  </CommandGroup>
                )}
              </>
            ) : (
              <CommandGroup className="p-0">{unpinned.map(renderItem)}</CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ConnectionCard({
  connection,
  onRemove,
}: {
  connection: Connection
  onRemove: VoidFunction
}) {
  const { connectionStringsCollection, connectionsResourcesCollection } = useCollections()
  const { data: connectionString } = useLiveQuery(
    q =>
      q
        .from({ cs: connectionStringsCollection })
        .where(({ cs }) => eq(cs.connectionId, connection.id))
        .findOne(),
    [connectionStringsCollection, connection.id],
  )
  const { data: connectionResources } = useLiveQuery(
    q =>
      q
        .from({ cr: connectionsResourcesCollection })
        .where(({ cr }) => eq(cr.connectionId, connection.id))
        .orderBy(({ cr }) => cr.name, 'asc'),
    [connectionsResourcesCollection, connection.id],
  )

  const connectionResourcesNames = connectionResources.map(
    r => r.name || CONNECTION_RESOURCE_ROOT_SYMBOL,
  )
  const { type, canSend, reason } = useFetchingConfig(connection)

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
  const { selectedResourceName, pinnedResourcesNames } = useSubscription(connectionStore, {
    selector: state => ({
      selectedResourceName: (state.lastOpenedResourceName ||
        defaultResourceName ||
        resources[0] ||
        null) as string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null,
      pinnedResourcesNames: state.pinnedResourcesNames,
    }),
  })
  const resolvedSelectedResourceName =
    selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL ? null : selectedResourceName
  const selectedResource = connectionResources.find(r => r.name === resolvedSelectedResourceName)
  const canOpenResource = canSend || (type === 'waiting-for-password' && !!window.electron)

  const handleCopy = async () => {
    const connectionString = await connectionStringsCollection.utils.decrypt(connection.id)

    const connectionStringToCopy = new SafeURL(connectionString)
    connectionStringToCopy.pathname =
      selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL || selectedResourceName === null
        ? ''
        : selectedResourceName

    copy(connectionStringToCopy.toString(), 'Connection string copied')
  }

  const handleClearPassword = async () => {
    const record = connectionStringsCollection.get(connection.id)
    if (!record) return

    const url = new SafeURL(await connectionStringsCollection.utils.decrypt(connection.id))
    url.password = ''

    const connectionStringRecord = await connectionStringsCollection.utils.prepare({
      connectionId: connection.id,
      connectionString: url.toString(),
      updatedAt: record.updatedAt,
    })

    connectionStringsCollection.update(connection.id, draft => {
      Object.assign(draft, connectionStringRecord)
    })

    toast.success('Password cleared from this device')
  }

  // Persisted names alone are enough to render the combobox — gating on the
  // live probe made multi-resource connections flash as a single string first
  const isResourcesShown = resources.length > 1
  // Persisted resources render immediately; only show loading affordances when
  // there is nothing stored yet (first probe of a fresh connection)
  const isLoadingVisible = isFetching && connectionResourcesNames.length === 0

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      style={connection.color ? { '--color': connection.color } : {}}
      className="
        relative flex flex-col border-b
        last:border-b-0
      "
    >
      <ContextMenu>
        <ContextMenuTrigger
          className={cn(`
            group relative flex h-11 items-center gap-3 px-3 transition-colors
            duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]
            hover:bg-accent/50
            has-[[data-resource-link]:hover]:bg-accent/50
          `)}
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
            <span
              className="
              pointer-events-none absolute top-1/2 left-0 h-5 w-0.5
              -translate-y-1/2 rounded-full bg-(--color)
            "
            />
          )}
          <div
            className={cn(
              `
          pointer-events-none relative z-10 flex min-w-0 flex-1 items-center
          gap-3
        `,
              isLoadingVisible && `animate-pulse`,
            )}
          >
            <ConnectionIconWithVersion connection={connection} />
            <div className="flex min-w-0 items-center gap-2">
              <span title={connection.name} className="truncate text-sm leading-none font-medium">
                {connection.name}
              </span>
              {isLoadingVisible && canSend && <Spinner className="size-3 shrink-0" />}
              {!canSend && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <RiAlertLine
                        className="
                      pointer-events-auto size-3 shrink-0 text-muted-foreground
                    "
                      />
                    }
                  />
                  <TooltipContent className="pointer-events-auto max-w-xs">{reason}</TooltipContent>
                </Tooltip>
              )}
              {error && canSend && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <RiAlertLine
                        className="
                    pointer-events-auto size-3 shrink-0 text-warning
                  "
                      />
                    }
                  />
                  <TooltipContent className="pointer-events-auto">
                    Failed to get resources: <p className="text-xs text-warning">{error.message}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <div
            className="
          pointer-events-none relative z-10 flex min-w-0 shrink-0 items-center
          gap-2 text-xs text-muted-foreground
        "
          >
            <div
              className="
                hidden max-w-52 min-w-0 items-center font-mono
                md:flex
              "
            >
              {connectionString?.displayUrl ? (
                <span className="truncate">{connectionString?.displayUrl}</span>
              ) : (
                <Skeleton className="h-3 w-40" />
              )}
            </div>
            {isResourcesShown ? (
              <ConnectionResourcesCombobox
                resources={resources}
                pinnedResourcesNames={pinnedResourcesNames}
                selectedResourceName={selectedResourceName}
                onSelectedResourceNameChange={value =>
                  connectionStore.set(
                    state => ({ ...state, lastOpenedResourceName: value }) satisfies typeof state,
                  )
                }
                onPinnedResourceNameChange={value =>
                  connectionStore.set(
                    state =>
                      ({
                        ...state,
                        pinnedResourcesNames: state.pinnedResourcesNames.includes(value)
                          ? state.pinnedResourcesNames.filter(name => name !== value)
                          : [...state.pinnedResourcesNames, value],
                      }) satisfies typeof state,
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
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-44">
          <ContextMenuItem disabled={!canSend} onClick={() => refetch()}>
            <RiRefreshLine className="size-4" />
            Refresh
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCopy()}>
            <RiFileCopyLine className="size-4" />
            Copy connection string
          </ContextMenuItem>
          {connection.syncType === SyncType.CloudWithoutPassword && (
            <ContextMenuItem
              className="whitespace-nowrap"
              disabled={!connectionString?.isPasswordPopulated}
              onClick={() => handleClearPassword()}
            >
              <RiLockUnlockLine className="size-4 shrink-0" />
              Clear password
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onClick={() => onRemove()}>
            <RiDeleteBinLine className="size-4" />
            Remove
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </motion.div>
  )
}

function GhostRow({
  nameWidth,
  urlWidth,
  lit = false,
  className,
}: {
  nameWidth: string
  urlWidth: string
  lit?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        `
      flex h-11 items-center gap-3 border-b border-border/40 px-3
      last:border-b-0
    `,
        className,
      )}
    >
      <span
        className={cn(
          'h-5 w-0.5 shrink-0 rounded-full',
          lit ? 'bg-primary' : 'bg-muted-foreground/20',
        )}
      />
      <span className="size-5 shrink-0 rounded-md bg-muted-foreground/15" />
      <span className={cn('h-2.5 rounded-full bg-muted-foreground/15', nameWidth)} />
      <span className="flex-1" />
      <span
        className={cn(
          `
        hidden h-2 rounded-full bg-muted-foreground/10
        md:block
      `,
          urlWidth,
        )}
      />
    </div>
  )
}

export function Empty() {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div
        className="
          pointer-events-none w-full max-w-md overflow-hidden rounded-xl border
          border-border/50 bg-card/40
          mask-[linear-gradient(to_bottom,black,transparent)]
        "
        aria-hidden
      >
        <GhostRow nameWidth="w-32" urlWidth="w-28" lit />
        <GhostRow nameWidth="w-24" urlWidth="w-36" className="opacity-70" />
        <GhostRow nameWidth="w-36" urlWidth="w-24" className="opacity-40" />
      </div>

      <div
        className="
        -mt-6 flex size-12 items-center justify-center rounded-xl border
        border-border/50 bg-card shadow-xs
      "
      >
        <RiDatabase2Line className="size-5 text-muted-foreground" />
      </div>

      <h2 className="mt-5 text-base font-medium text-foreground">No connections yet</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Add a database and it shows up here — open it in one click.
      </p>

      <Button className="mt-5" render={<Link to="/create" />}>
        <RiAddLine className="size-4" />
        New connection
      </Button>
    </div>
  )
}

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

export function ConnectionsList() {
  const { connectionsCollection } = useCollections()
  const sort = useSubscription(sortValue)
  const { data } = useLiveQuery(
    q => {
      let query = q.from({ c: connectionsCollection })

      if (sort === 'date-desc') {
        query = query.orderBy(({ c }) => c.createdAt, 'desc')
      } else if (sort === 'date-asc') {
        query = query.orderBy(({ c }) => c.createdAt, 'asc')
      } else if (sort === 'name-asc') {
        query = query.orderBy(({ c }) => c.name, 'asc')
      } else {
        query = query.orderBy(({ c }) => c.name, 'desc')
      }

      return query
    },
    [connectionsCollection, sort],
  )

  const removeDialogRef = useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)
  const lastOpenedResources = useSubscription(lastOpenedResourcesStorageValue)
  const grouping = useSubscription(groupValue)

  // Connections grouped into sections (by label or database type, alphabetical,
  // ungrouped last) — sections instead of filter tabs, so every group is
  // visible at once
  const groupKey = (connection: Connection): string | null => {
    if (grouping === 'label') return connection.label || null
    if (grouping === 'type') return connectionLabels[connection.type]
    return null
  }
  const keys = [
    ...new Set(data.flatMap(connection => (groupKey(connection) ? [groupKey(connection)!] : []))),
  ].toSorted()
  const groups: { label: string | null; connections: Connection[] }[] = [
    ...keys.map(key => ({
      label: key as string | null,
      connections: data.filter(connection => groupKey(connection) === key),
    })),
    { label: null, connections: data.filter(connection => groupKey(connection) === null) },
  ].filter(group => group.connections.length > 0)
  const showHeaders = keys.length > 0

  const showLastOpened = lastOpenedResources.length > 0 && data.length > 1

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      {showLastOpened && <LastOpenedResources />}
      {data.length > 1 && (
        <div className="flex items-center justify-between gap-4">
          <span
            className="
              px-2 text-2xs font-semibold tracking-wider
              text-muted-foreground uppercase
            "
          >
            {data.length} connection{data.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <Select value={grouping} onValueChange={value => groupValue.set(value!)}>
              <SelectTrigger size="sm" className="shrink-0">
                <RiStackLine />
                <SelectValue>
                  {groupOptions.find(option => option.value === grouping)!.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={value => sortValue.set(value!)}>
              <SelectTrigger size="sm" className="shrink-0">
                {sort.includes('asc') ? <RiSortAsc /> : <RiSortDesc />}
                <SelectValue>
                  {sortOptions.find(option => option.value === sort)!.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-foreground"
              render={<Link to="/create" />}
            >
              <RiAddLine className="size-4 text-muted-foreground" />
              New
            </Button>
          </div>
        </div>
      )}
      {data.length > 0 ? (
        <div className="flex flex-col gap-5">
          {groups.map(group => (
            <div key={group.label ?? '__other__'} className="flex flex-col">
              {showHeaders && (
                <h3
                  className="
                    mb-1.5 px-2 text-2xs font-semibold tracking-wider
                    text-muted-foreground uppercase
                  "
                >
                  {group.label ?? 'Other'}
                </h3>
              )}
              <div
                className="
                  overflow-hidden rounded-xl border bg-card shadow-xs
                "
              >
                <AnimatePresence initial={false} mode="popLayout">
                  {group.connections.map(connection => (
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
            className="
              flex h-10 cursor-default items-center justify-center gap-2
              rounded-xl border border-dashed text-sm text-muted-foreground
              transition-colors duration-150
              hover:bg-card hover:text-foreground
            "
          >
            <RiAddLine className="size-4" />
            New connection
          </Link>
        </div>
      ) : (
        <Empty />
      )}
    </div>
  )
}
