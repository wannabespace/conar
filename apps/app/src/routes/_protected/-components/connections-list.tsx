import type { ComponentRef } from 'react'
import type { Connection } from '~/entities/connection'
import { RiAlertLine, RiArrowDownSLine, RiCheckLine, RiDeleteBinLine, RiLockUnlockLine, RiMoreLine, RiPushpinFill, RiPushpinLine, RiRefreshLine, RiSortAsc, RiSortDesc } from '@remixicon/react'
import { CONNECTION_RESOURCE_ROOT_LABEL, CONNECTION_RESOURCE_ROOT_SYMBOL } from '@tamery/shared/constants'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import { Card } from '@tamery/ui/components/card'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@tamery/ui/components/command'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@tamery/ui/components/dropdown-menu'
import { FrameMotion } from '@tamery/ui/components/frame.motion'
import { Popover, PopoverContent, PopoverTrigger } from '@tamery/ui/components/popover'
import { ScrollArea } from '@tamery/ui/components/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tamery/ui/components/select'
import { Separator } from '@tamery/ui/components/separator'
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
import { AnimatePresence } from 'motion/react'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'
import { toast } from 'sonner'
import { useCollections } from '~/entities/collections'
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
  const { data: version, isPending: isVersionPending, refetch: refetchVersion, isRefetching: isVersionRefetching } = useQuery({
    ...connectionVersionQueryOptions(connection),
    enabled: canSend,
  })

  return (
    <Tooltip>
      <TooltipTrigger render={(
        <ConnectionIcon
          type={connection.type}
          className="pointer-events-auto size-6 shrink-0"
        />
      )}
      />

      <TooltipContent
        side="left"
        className="pointer-events-auto flex items-center gap-1"
        sideOffset={10}
      >
        <span className="opacity-50">Version: </span>
        {!canSend
          ? <span className="opacity-50">Unavailable in web app</span>
          : isVersionPending
            ? <span className="animate-pulse">Loading version...</span>
            : version
              ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="cursor-pointer"
                      onClick={() => refetchVersion()}
                    >
                      {version}
                    </button>
                    {isVersionRefetching && (
                      <Spinner className="size-3" />
                    )}
                  </div>
                )
              : <span className="opacity-50">Version cannot be detected</span>}
      </TooltipContent>
    </Tooltip>
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

  function resourceValue(resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL) {
    return resource === CONNECTION_RESOURCE_ROOT_SYMBOL ? CONNECTION_RESOURCE_ROOT_SYMBOL.description! : resource
  }

  function resourceLabel(resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL) {
    return resource === CONNECTION_RESOURCE_ROOT_SYMBOL ? CONNECTION_RESOURCE_ROOT_LABEL : resource
  }

  function renderItem(resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL) {
    const isPinned = pinnedResourcesNames.includes(resource)

    return (
      <CommandItem
        key={resourceValue(resource)}
        value={resourceValue(resource)}
        keywords={[resourceLabel(resource)]}
        className="group"
        onSelect={() => {
          onSelectedResourceNameChange(resourceValue(resource))
          setOpen(false)
        }}
      >
        <RiCheckLine
          className={cn(
            'size-3.5 shrink-0 text-primary',
            resource === selectedResourceName ? 'opacity-100' : 'opacity-0',
          )}
        />
        <span className="flex-1 truncate">
          {resourceLabel(resource)}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn(
            '-mr-1 shrink-0',
            !isPinned && `
              opacity-0
              group-hover:opacity-100
            `,
          )}
          onClick={(e) => {
            e.stopPropagation()
            onPinnedResourceNameChange(resource)
          }}
        >
          {isPinned
            ? <RiPushpinFill className="size-3.5 text-primary" />
            : <RiPushpinLine className="size-3.5" />}
        </Button>
      </CommandItem>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(
          <Button
            variant="outline"
            size="xs"
            disabled={disabled}
            className="pointer-events-auto text-xs"
          />
        )}
      >
        {selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL ? CONNECTION_RESOURCE_ROOT_LABEL : selectedResourceName}
        <RiArrowDownSLine />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="pointer-events-auto w-56 overflow-hidden p-0"
      >
        <Command>
          <CommandInput placeholder="Search resources..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {pinned.length > 0 && (
              <CommandGroup heading="Pinned">
                {pinned.map(renderItem)}
              </CommandGroup>
            )}
            {unpinned.length > 0 && (
              <CommandGroup heading="Unpinned">
                {unpinned.map(renderItem)}
              </CommandGroup>
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
  const { data: connectionString } = useLiveQuery(q => q
    .from({ cs: connectionStringsCollection })
    .where(({ cs }) => eq(cs.connectionId, connection.id))
    .findOne(), [connectionStringsCollection, connection.id])
  const { data: connectionResources } = useLiveQuery(q => q
    .from({ cr: connectionsResourcesCollection })
    .where(({ cr }) => eq(cr.connectionId, connection.id))
    .orderBy(({ cr }) => cr.name, 'asc'), [connectionsResourcesCollection, connection.id])

  const connectionResourcesNames = connectionResources.map(r => r.name || CONNECTION_RESOURCE_ROOT_SYMBOL)
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
      selectedResourceName: (state.lastOpenedResourceName || defaultResourceName || resources[0] || null) as string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null,
      pinnedResourcesNames: state.pinnedResourcesNames,
    }),
  })
  const resolvedSelectedResourceName = selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL ? null : selectedResourceName
  const selectedResource = connectionResources.find(r => r.name === resolvedSelectedResourceName)
  const canOpenResource = canSend || (type === 'waiting-for-password' && !!window.electron)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const connectionString = await connectionStringsCollection.utils.decrypt(connection.id)

    const connectionStringToCopy = new SafeURL(connectionString)
    connectionStringToCopy.pathname = selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL || selectedResourceName === null ? '' : selectedResourceName

    copy(connectionStringToCopy.toString())
    setIsCopied(true)

    timeoutRef.current = setTimeout(() => {
      setIsCopied(false)
      timeoutRef.current = null
    }, 3000)
  }

  const handleClearPassword = async () => {
    const record = connectionStringsCollection.get(connection.id)
    if (!record)
      return

    const url = new SafeURL(await connectionStringsCollection.utils.decrypt(connection.id))
    url.password = ''

    const connectionStringRecord = await connectionStringsCollection.utils.prepare({
      connectionId: connection.id,
      connectionString: url.toString(),
      updatedAt: record.updatedAt,
    })

    connectionStringsCollection.update(connection.id, (draft) => {
      Object.assign(draft, connectionStringRecord)
    })

    toast.success('Password cleared from this device')
  }

  const isResourcesShown = resources.length > 1 && (!canSend || !isPending)

  return (
    <FrameMotion
      layout="position"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      style={connection.color ? { '--color': connection.color } : {}}
    >
      <Card
        className={cn(
          'relative',
          connection.color && `border-(--color)`,
          `has-[:where([data-resource-link]:hover)]:bg-accent`,
        )}
      >
        {selectedResource && canOpenResource && (
          <ConnectionResourceLink
            resourceId={selectedResource.id}
            className="absolute inset-0 cursor-default rounded-lg"
            preload={false}
            data-resource-link
          />
        )}
        <div className="
          pointer-events-none relative z-10 flex items-center justify-between
          gap-4 px-6 py-4
        "
        >
          <div className={cn(`flex min-w-0 items-center gap-4`, isFetching && `
            animate-pulse
          `)}
          >
            <ConnectionIconWithVersion connection={connection} />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2 leading-none font-medium">
                <span title={connection.name}>
                  {connection.name}
                </span>
                {connection.label && (
                  <Badge variant="secondary" className="max-w-36 truncate">
                    {connection.label}
                  </Badge>
                )}
                {isFetching && canSend && (
                  <Spinner className="size-3" />
                )}
                {!canSend && (
                  <Tooltip>
                    <TooltipTrigger render={(
                      <RiAlertLine
                        className="
                          pointer-events-auto size-3 text-muted-foreground
                        "
                      />
                    )}
                    />
                    <TooltipContent className="pointer-events-auto max-w-xs">
                      {reason}
                    </TooltipContent>
                  </Tooltip>
                )}
                {error && canSend && (
                  <Tooltip>
                    <TooltipTrigger render={(
                      <RiAlertLine className="
                        pointer-events-auto size-3 text-warning
                      "
                      />
                    )}
                    />

                    <TooltipContent className="pointer-events-auto">
                      Failed to get resources:
                      {' '}
                      <p className="text-xs text-warning">{error.message}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="
                flex h-4 min-w-0 items-center gap-1 text-xs
                text-muted-foreground
              "
              >
                <Tooltip open={isOpen || isCopied} onOpenChange={setIsOpen}>
                  <TooltipTrigger
                    className="
                      pointer-events-auto flex min-w-0 cursor-pointer
                      items-center
                    "
                    onClick={() => handleCopy()}
                  >
                    {connectionString?.displayUrl
                      ? <span className="truncate">{connectionString?.displayUrl}</span>
                      : <Skeleton className="h-3 w-40" />}
                  </TooltipTrigger>
                  <TooltipContent className="flex items-center gap-1" side="bottom">
                    {isCopied ? 'Connection string copied!' : 'Copy connection string'}
                  </TooltipContent>
                </Tooltip>
                {(isResourcesShown || selectedResourceName !== CONNECTION_RESOURCE_ROOT_SYMBOL) && (
                  <span className="shrink-0">
                    /
                    {!isResourcesShown && selectedResourceName !== CONNECTION_RESOURCE_ROOT_SYMBOL
                      ? selectedResourceName
                      : null}
                  </span>
                )}
                {isResourcesShown && (
                  <ConnectionResourcesCombobox
                    resources={resources}
                    pinnedResourcesNames={pinnedResourcesNames}
                    selectedResourceName={selectedResourceName}
                    onSelectedResourceNameChange={value => connectionStore.set(state => ({ ...state, lastOpenedResourceName: value } satisfies typeof state))}
                    onPinnedResourceNameChange={value => connectionStore.set(state => ({
                      ...state,
                      pinnedResourcesNames: state.pinnedResourcesNames.includes(value)
                        ? state.pinnedResourcesNames.filter(name => name !== value)
                        : [...state.pinnedResourcesNames, value],
                    } satisfies typeof state))}
                    disabled={!canSend}
                  />
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="pointer-events-auto"
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <RiMoreLine className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuItem
                disabled={!canSend}
                onClick={() => refetch()}
              >
                <RiRefreshLine className="size-4" />
                Refresh
              </DropdownMenuItem>
              {connection.syncType === SyncType.CloudWithoutPassword && (
                <DropdownMenuItem
                  className="whitespace-nowrap"
                  disabled={!connectionString?.isPasswordPopulated}
                  onClick={() => handleClearPassword()}
                >
                  <RiLockUnlockLine className="size-4 shrink-0" />
                  Clear password
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onRemove()}
              >
                <RiDeleteBinLine className="size-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </FrameMotion>
  )
}

export function Empty() {
  return (
    <div className={`
      group m-auto w-full rounded-xl border-2 border-dashed border-border/50
      bg-card p-14 text-center
    `}
    >
      <h2 className="mt-6 font-medium text-foreground">
        No connections found
      </h2>
      <p className="mt-1 mb-4 text-sm whitespace-pre-line text-muted-foreground">
        Create a new connection to get started.
      </p>
      <Button render={<Link to="/create" />}>
        Create a new connection
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
  schema: type('string' as type.cast<typeof sortOptions[number]['value']>),
  defaultValue: 'date-desc',
})

export function ConnectionsList() {
  const { connectionsCollection } = useCollections()
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const sort = useSubscription(sortValue)
  const { data } = useLiveQuery((q) => {
    let query = q.from({ c: connectionsCollection })

    if (sort === 'date-desc') {
      query = query.orderBy(({ c }) => c.createdAt, 'desc')
    }
    else if (sort === 'date-asc') {
      query = query.orderBy(({ c }) => c.createdAt, 'asc')
    }
    else if (sort === 'name-asc') {
      query = query.orderBy(({ c }) => c.name, 'asc')
    }
    else {
      query = query.orderBy(({ c }) => c.name, 'desc')
    }

    if (selectedLabel) {
      query = query.where(({ c }) => eq(c.label, selectedLabel))
    }

    return query
  }, [connectionsCollection, selectedLabel, sort])

  const removeDialogRef = useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)
  const lastOpenedResources = useSubscription(lastOpenedResourcesStorageValue)

  const availableLabels = [...new Set(data.flatMap(connection => connection.label ? [connection.label] : []))].toSorted()
  const showLastOpened = lastOpenedResources.length > 0 && data.length > 1

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      {showLastOpened && (
        <>
          <LastOpenedResources />
          <Separator />
        </>
      )}
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
                  <TabsTrigger value="all">
                    All
                  </TabsTrigger>
                  {availableLabels.map(label => (
                    <TabsTrigger key={label} value={label}>
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </ScrollArea>
          )}
          <Select
            value={sort}
            onValueChange={value => sortValue.set(value!)}
          >
            <SelectTrigger className="w-50 shrink-0">
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
        </div>
      )}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {data.length > 0
            ? data.map(connection => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onRemove={() => {
                    removeDialogRef.current?.remove(connection)
                  }}
                />
              ))
            : <Empty />}
        </AnimatePresence>
      </div>
    </div>
  )
}
