import type { ComponentRef } from 'react'
import type { connections as connectionsTable } from '~/drizzle/schema'
import { CONNECTION_RESOURCE_ROOT_LABEL, CONNECTION_RESOURCE_ROOT_SYMBOL } from '@conar/shared/constants'
import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card } from '@conar/ui/components/card'
import { Combobox, ComboboxCollection, ComboboxEmpty, ComboboxGroup, ComboboxGroupLabel, ComboboxInput, ComboboxItem, ComboboxList, ComboboxPopup, ComboboxTrigger } from '@conar/ui/components/combobox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { FrameMotion } from '@conar/ui/components/frame'
import { Separator } from '@conar/ui/components/separator'
import { Spinner } from '@conar/ui/components/spinner'
import { Tabs, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiAlertLine, RiArrowDownSLine, RiDeleteBinLine, RiMoreLine, RiPushpinFill, RiPushpinLine, RiRefreshLine, RiSearchLine } from '@remixicon/react'
import { and, eq, useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AnimatePresence } from 'motion/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { v7 } from 'uuid'
import { ConnectionIcon } from '~/entities/connection/components'
import { ConnectionResourceLink } from '~/entities/connection/components/connection-resource-link'
import { connectionResourcesQueryOptions } from '~/entities/connection/queries'
import { connectionVersionQueryOptions } from '~/entities/connection/queries/connection-version'
import { getConnectionStore } from '~/entities/connection/store'
import { connectionsCollection, connectionsResourcesCollection } from '~/entities/connection/sync'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils'
import { LastOpenedResources } from './last-opened-resources'
import { RemoveConnectionDialog } from './remove-connection-dialog'

function useConnectionResources(connection: typeof connectionsTable.$inferSelect) {
  const { data: resources } = useLiveQuery(q => q
    .from({ connectionsResources: connectionsResourcesCollection })
    .where(({ connectionsResources }) => eq(connectionsResources.connectionId, connection.id))
    .orderBy(({ connectionsResources }) => connectionsResources.name, 'asc'), [connection.id])
  const { data, ...props } = useQuery(connectionResourcesQueryOptions(connection))

  return { data: data || resources.map(r => r.name || CONNECTION_RESOURCE_ROOT_SYMBOL), ...props }
}

function ConnectionIconWithVersion({ connection }: { connection: typeof connectionsTable.$inferSelect }) {
  const { data: version, isPending: isVersionPending, refetch: refetchVersion, isRefetching: isVersionRefetching } = useQuery(connectionVersionQueryOptions(connection))
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ConnectionIcon
          type={connection.type}
          className="pointer-events-auto size-6 shrink-0"
        />
      </TooltipTrigger>
      <TooltipContent
        side="left"
        className="pointer-events-auto flex items-center gap-1"
        sideOffset={10}
      >
        <span className="opacity-50">Version: </span>
        {isVersionPending
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
}: {
  resources: (string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL)[]
  selectedResourceName: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null
  onSelectedResourceNameChange: (resource: string | null) => void
  pinnedResourcesNames: (string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL)[]
  onPinnedResourceNameChange: (resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL) => void
}) {
  const groupedResources = Object.entries(resources.reduce<{ pinned: typeof resources[number][], unpinned: typeof resources[number][] }>((acc, resource) => {
    const isPinned = pinnedResourcesNames.includes(resource)
    if (isPinned) {
      acc.pinned.push(resource)
    }
    else {
      acc.unpinned.push(resource)
    }
    return acc
  }, { pinned: [], unpinned: [] })).map(([value, items]) => ({ value: uppercaseFirst(value), items }))

  return (
    <Combobox
      items={groupedResources}
      value={selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL ? CONNECTION_RESOURCE_ROOT_SYMBOL.description : selectedResourceName}
      onValueChange={onSelectedResourceNameChange}
    >
      <ComboboxTrigger
        className="text-xs"
        render={<Button variant="outline" size="xs" />}
      >
        {selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL ? CONNECTION_RESOURCE_ROOT_LABEL : selectedResourceName}
        <RiArrowDownSLine />
      </ComboboxTrigger>
      <ComboboxPopup className="max-w-80 min-w-48">
        <div className="border-b p-2">
          <ComboboxInput
            className="
              rounded-md
              before:rounded-[calc(var(--radius-md)-1px)]
            "
            placeholder="Search resources"
            showTrigger={false}
            startAddon={<RiSearchLine />}
          />
        </div>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(group: typeof groupedResources[number]) => (
            <Fragment key={group.value}>
              <ComboboxGroup items={group.items}>
                <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
                <ComboboxCollection>
                  {(resource: typeof group.items[number]) => (
                    <ComboboxItem
                      key={resource === CONNECTION_RESOURCE_ROOT_SYMBOL ? CONNECTION_RESOURCE_ROOT_SYMBOL.description : resource}
                      value={resource === CONNECTION_RESOURCE_ROOT_SYMBOL ? CONNECTION_RESOURCE_ROOT_SYMBOL.description : resource}
                      className="group"
                    >
                      <span
                        className="
                          flex w-full min-w-0 items-center justify-between gap-2
                        "
                      >
                        <span className="flex-1 truncate">
                          {resource === CONNECTION_RESOURCE_ROOT_SYMBOL ? CONNECTION_RESOURCE_ROOT_LABEL : resource}
                        </span>
                        {/* {resources.length > 10 && ( */}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="
                            -mr-3 shrink-0 opacity-0
                            group-hover:opacity-100
                          "
                          onClick={(e) => {
                            e.stopPropagation()
                            onPinnedResourceNameChange(resource)
                          }}
                        >
                          {pinnedResourcesNames.includes(resource)
                            ? (
                                <RiPushpinFill className="size-3.5 text-primary" />
                              )
                            : (
                                <RiPushpinLine className="size-3.5" />
                              )}
                        </Button>
                        {/* )} */}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            </Fragment>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

async function createResource(connectionId: string, name: string | null) {
  await connectionsResourcesCollection.utils.waitForSync()
  connectionsResourcesCollection.insert({
    id: v7(),
    connectionId,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

function ConnectionCard({
  connection,
  onRemove,
}: {
  connection: typeof connectionsTable.$inferSelect
  onRemove: VoidFunction
}) {
  const { data: resources, isPending, isFetching, error, refetch } = useConnectionResources(connection)

  const [isOpen, setIsOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const connectionString = new SafeURL(connection.connectionString)
  const connectionStringToShow = `${connectionString.hostname}${connectionString.port ? `:${connectionString.port}` : ''}`

  const connectionStore = getConnectionStore(connection.id)
  const { selectedResourceName, pinnedResourcesNames } = useSubscription(connectionStore, {
    selector: state => ({
      selectedResourceName: (state.lastOpenedResourceName || connectionString.pathname.slice(1) || resources[0] || null) as string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null,
      pinnedResourcesNames: state.pinnedResourcesNames,
    }),
  })

  const { data: selectedResource } = useLiveQuery(q => q
    .from({ connectionsResources: connectionsResourcesCollection })
    .where(({ connectionsResources }) => and(
      eq(connectionsResources.connectionId, connection.id),
      eq(connectionsResources.name, selectedResourceName),
    ))
    .findOne(), [connection.id, selectedResourceName])

  useEffect(() => {
    if (!selectedResource) {
      createResource(connection.id, selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL ? null : selectedResourceName)
    }
  }, [selectedResourceName, selectedResource, connection.id])

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const connectionStringToCopy = new SafeURL(connectionString)

    connectionStringToCopy.pathname = selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL || selectedResourceName === null ? '' : selectedResourceName

    copy(connectionStringToCopy.toString())
    setIsCopied(true)

    timeoutRef.current = setTimeout(() => {
      setIsCopied(false)
      timeoutRef.current = null
    }, 3000)
  }

  const isResourcesShown = resources.length > 1 && !isPending

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
        {selectedResource
          ? (
              <ConnectionResourceLink
                resourceId={selectedResource.id}
                className="absolute inset-0 rounded-lg"
                preload={false}
                data-resource-link
              />
            )
          : null}
        <div className="
          pointer-events-none relative z-10 flex items-center justify-between
          gap-4 px-6 py-4
        "
        >
          <div className="flex items-center gap-4">
            <ConnectionIconWithVersion connection={connection} />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 leading-none font-medium">
                <span title={connection.name}>
                  {connection.name}
                </span>
                {connection.label && (
                  <Badge variant="secondary" className="max-w-36 truncate">
                    {connection.label}
                  </Badge>
                )}
                {isFetching && <Spinner className="size-3" />}
                {error && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <RiAlertLine className="
                        pointer-events-auto size-3 text-warning
                      "
                      />
                    </TooltipTrigger>
                    <TooltipContent className="pointer-events-auto">
                      Failed to get resources:
                      {' '}
                      <p className="text-xs text-warning">{error.message}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="pointer-events-auto flex h-4 items-center gap-1">
                <Tooltip open={isOpen || isCopied} onOpenChange={setIsOpen}>
                  <TooltipTrigger
                    className="
                      group flex cursor-pointer items-center gap-1 text-xs
                      text-muted-foreground
                    "
                    onClick={() => handleCopy()}
                  >
                    {connectionStringToShow}
                    {isResourcesShown
                      ? <span>/</span>
                      : selectedResourceName !== CONNECTION_RESOURCE_ROOT_SYMBOL && (
                        <span>
                          /
                          {selectedResourceName}
                        </span>
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
                    onSelectedResourceNameChange={value => connectionStore.set(state => ({ ...state, lastOpenedResourceName: value } satisfies typeof state))}
                    onPinnedResourceNameChange={value => connectionStore.set(state => ({
                      ...state,
                      pinnedResourcesNames: state.pinnedResourcesNames.includes(value)
                        ? state.pinnedResourcesNames.filter(name => name !== value)
                        : [...state.pinnedResourcesNames, value],
                    } satisfies typeof state))}
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => refetch()}
              >
                <RiRefreshLine className="size-4" />
                Refresh
              </DropdownMenuItem>
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

export function ConnectionsList() {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const { data } = useLiveQuery((q) => {
    let query = q
      .from({ connections: connectionsCollection })
      .orderBy(({ connections }) => connections.createdAt, 'desc')

    if (selectedLabel) {
      query = query.where(({ connections }) => eq(connections.label, selectedLabel))
    }

    return query
  }, [selectedLabel])

  const removeDialogRef = useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)
  const lastOpenedResources = useSubscription(lastOpenedResourcesStorageValue)

  const availableLabels = [...new Set(data.map(connection => connection.label).filter(Boolean) as string[])].toSorted()
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
      {availableLabels.length > 0 && (
        <Tabs
          value={selectedLabel === null ? 'all' : selectedLabel}
          onValueChange={value => setSelectedLabel(value === 'all' ? null : value)}
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
