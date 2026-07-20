import {
  RiAddLine,
  RiAlertLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiDatabase2Line,
  RiDeleteBinLine,
  RiLockUnlockLine,
  RiPushpinFill,
  RiPushpinLine,
  RiRefreshLine,
  RiSortAsc,
  RiSortDesc,
} from '@remixicon/react'
import {
  CONNECTION_RESOURCE_ROOT_LABEL,
  CONNECTION_RESOURCE_ROOT_SYMBOL,
} from '@tamery/shared/constants'
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
} from '@tamery/ui/components/command'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@tamery/ui/components/context-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@tamery/ui/components/popover'
import { ScrollArea } from '@tamery/ui/components/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { Spinner } from '@tamery/ui/components/spinner'
import { Tabs, TabsList, TabsTrigger } from '@tamery/ui/components/tabs'
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
            <button type="button" className="cursor-pointer" onClick={() => refetchVersion()}>
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
    const isPinned = pinnedResourcesNames.includes(resource)
    const isSelected = resource === selectedResourceName

    return (
      <CommandItem
        key={resourceValue(resource)}
        value={resourceValue(resource)}
        keywords={[resourceLabel(resource)]}
        className="group h-7 pr-1 text-sm"
        onSelect={() => {
          onSelectedResourceNameChange(resourceValue(resource))
          setOpen(false)
        }}
      >
        <RiCheckLine
          className={cn(
            'size-3.5 shrink-0 text-foreground',
            isSelected ? 'opacity-100' : 'opacity-0',
          )}
        />
        <RiDatabase2Line className="size-3.5 shrink-0 text-muted-foreground/70" />
        <span className={cn('flex-1 truncate', isSelected && 'font-medium')}>
          {resourceLabel(resource)}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={isPinned ? 'Unpin resource' : 'Pin resource'}
          className={cn(
            'shrink-0',
            !isPinned &&
              `
              opacity-0
              group-hover:opacity-100
            `,
          )}
          onClick={e => {
            e.stopPropagation()
            onPinnedResourceNameChange(resource)
          }}
        >
          {isPinned ? (
            <RiPushpinFill className="size-3.5 text-primary" />
          ) : (
            <RiPushpinLine className="size-3.5" />
          )}
        </Button>
      </CommandItem>
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
            className="pointer-events-auto text-xs"
          />
        }
      >
        {selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL
          ? CONNECTION_RESOURCE_ROOT_LABEL
          : selectedResourceName}
        <RiArrowDownSLine />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          'pointer-events-auto overflow-hidden p-0',
          hasSearch ? 'w-56' : 'w-auto min-w-40',
        )}
      >
        <Command>
          {hasSearch && <CommandInput placeholder="Search resources..." />}
          <CommandList className="p-1">
            <CommandEmpty>No results found.</CommandEmpty>
            {hasGroups ? (
              <>
                <CommandGroup heading="Pinned">{pinned.map(renderItem)}</CommandGroup>
                {unpinned.length > 0 && (
                  <CommandGroup heading="Other">{unpinned.map(renderItem)}</CommandGroup>
                )}
              </>
            ) : (
              <CommandGroup>{unpinned.map(renderItem)}</CommandGroup>
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
    isPending,
    isFetching,
    error,
    refetch,
  } = useQuery({
    ...connectionResourcesQueryOptions(connection),
    enabled: canSend,
  })

  const [isOpen, setIsOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

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

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const connectionString = await connectionStringsCollection.utils.decrypt(connection.id)

    const connectionStringToCopy = new SafeURL(connectionString)
    connectionStringToCopy.pathname =
      selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL || selectedResourceName === null
        ? ''
        : selectedResourceName

    copy(connectionStringToCopy.toString())
    setIsCopied(true)

    timeoutRef.current = setTimeout(() => {
      setIsCopied(false)
      timeoutRef.current = null
    }, 3000)
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

  const isResourcesShown = resources.length > 1 && (!canSend || !isPending)

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
              isFetching && `animate-pulse`,
            )}
          >
            <ConnectionIconWithVersion connection={connection} />
            <div className="flex min-w-0 items-center gap-2">
              <span title={connection.name} className="truncate text-sm leading-none font-medium">
                {connection.name}
              </span>
              {connection.label && (
                <span className="shrink-0 truncate text-xs text-muted-foreground">
                  · {connection.label}
                </span>
              )}
              {isFetching && canSend && <Spinner className="size-3 shrink-0" />}
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
            <Tooltip open={isOpen || isCopied} onOpenChange={setIsOpen}>
              <TooltipTrigger
                className="
                pointer-events-auto hidden max-w-52 min-w-0 cursor-default
                items-center font-mono
                md:flex
              "
                onClick={() => handleCopy()}
              >
                {connectionString?.displayUrl ? (
                  <span className="truncate">{connectionString?.displayUrl}</span>
                ) : (
                  <Skeleton className="h-3 w-40" />
                )}
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-1" side="bottom">
                {isCopied ? 'Connection string copied!' : 'Copy connection string'}
              </TooltipContent>
            </Tooltip>
            {isResourcesShown && (
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
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-44">
          <ContextMenuItem disabled={!canSend} onClick={() => refetch()}>
            <RiRefreshLine className="size-4" />
            Refresh
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

export function ConnectionsList() {
  const { connectionsCollection } = useCollections()
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const sort = useSubscription(sortValue)
  const { data: allConnections } = useLiveQuery(
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

  // Label filtering happens client-side so recents and the label tabs derive
  // from the full list — picking a label must not hide them
  const data = selectedLabel
    ? allConnections.filter(connection => connection.label === selectedLabel)
    : allConnections

  const removeDialogRef = useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)
  const lastOpenedResources = useSubscription(lastOpenedResourcesStorageValue)

  const availableLabels = [
    ...new Set(allConnections.flatMap(connection => (connection.label ? [connection.label] : []))),
  ].toSorted()
  const showLastOpened = lastOpenedResources.length > 0 && allConnections.length > 1

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      {showLastOpened && <LastOpenedResources />}
      {data.length > 0 && (
        <div
          className={cn(
            'flex min-w-0 flex-nowrap items-center gap-4',
            availableLabels.length > 0 ? 'justify-between' : 'justify-end',
          )}
        >
          {availableLabels.length > 0 && (
            <ScrollArea className="min-w-0 flex-1" viewportClassName="scroll-fade-x">
              <Tabs
                value={selectedLabel === null ? 'all' : selectedLabel}
                onValueChange={value => setSelectedLabel(value === 'all' ? null : value)}
                className="w-max max-w-none"
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  {availableLabels.map(label => (
                    <TabsTrigger key={label} value={label}>
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </ScrollArea>
          )}
          <Select value={sort} onValueChange={value => sortValue.set(value!)}>
            <SelectTrigger className="h-7 w-46 shrink-0 text-sm">
              {sort.includes('asc') ? <RiSortAsc /> : <RiSortDesc />}
              <SelectValue>{sortOptions.find(option => option.value === sort)!.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {data.length > 0 ? (
        <div
          className="
            overflow-hidden rounded-xl border bg-card shadow-xs
          "
        >
          <AnimatePresence initial={false} mode="popLayout">
            {data.map(connection => (
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
      ) : (
        <Empty />
      )}
    </div>
  )
}
