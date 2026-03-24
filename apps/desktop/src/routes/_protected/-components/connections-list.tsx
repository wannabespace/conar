import type { ComponentRef } from 'react'
import type { connections as connectionsTable } from '~/drizzle/schema'
import { CONNECTION_SYSTEM_NAMES } from '@conar/shared/constants'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card } from '@conar/ui/components/card'
import { Combobox, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxPopup, ComboboxTrigger } from '@conar/ui/components/combobox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { FrameMotion } from '@conar/ui/components/frame'
import { Separator } from '@conar/ui/components/separator'
import { Spinner } from '@conar/ui/components/spinner'
import { Tabs, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownSLine, RiDeleteBinLine, RiMoreLine, RiPushpinLine, RiSearchLine } from '@remixicon/react'
import { and, eq, useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AnimatePresence } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { v7 } from 'uuid'
import { ConnectionIcon } from '~/entities/connection/components'
import { ConnectionResourceLink } from '~/entities/connection/components/connection-resource-link'
import { connectionResourcesQuery } from '~/entities/connection/queries'
import { connectionVersionQuery } from '~/entities/connection/queries/connection-version'
import { getConnectionStore } from '~/entities/connection/store'
import { connectionsCollection, connectionsResourcesCollection } from '~/entities/connection/sync'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils'
import { LastOpenedResources } from './last-opened-resources'
import { RemoveConnectionDialog } from './remove-connection-dialog'

function ConnectionCard({
  connection,
  onRemove,
}: {
  connection: typeof connectionsTable.$inferSelect
  onRemove: VoidFunction
}) {
  const { data: fetchedResources = [] } = useQuery(connectionResourcesQuery(connection))
  const connectionString = new SafeURL(connection.connectionString)
  const connectionPathname = connectionString.pathname.slice(1)
  const [isOpen, setIsOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const connectionStore = getConnectionStore(connection.id)
  const selectedResourceName = useSubscription(connectionStore, {
    selector: state => state.lastOpenedResourceName || connectionPathname || fetchedResources[0] || CONNECTION_SYSTEM_NAMES[connection.type],
  })
  const { data: selectedResource } = useLiveQuery(q => q
    .from({ connectionsResources: connectionsResourcesCollection })
    .where(({ connectionsResources }) => and(
      eq(connectionsResources.connectionId, connection.id),
      eq(connectionsResources.name, selectedResourceName),
    ))
    .findOne(), [connection.id, selectedResourceName])
  const showSystemName = CONNECTION_SYSTEM_NAMES[connection.type] !== selectedResourceName

  const connectionStringToShow = `${connectionString.hostname}${connectionString.port ? `:${connectionString.port}` : ''}`

  useEffect(() => {
    if (!selectedResource) {
      connectionsResourcesCollection.insert({
        id: v7(),
        connectionId: connection.id,
        name: selectedResourceName,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }, [selectedResourceName, selectedResource, connection])

  // const { mutate: sync, isPending: isSyncing, error: syncError } = useMutation({
  //   mutationFn: async () => {
  //     await syncConnectionResources(connection)
  //   },
  // })

  // useEffect(() => {
  //   sync()
  // }, [sync])

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const connectionStringToCopy = new SafeURL(connectionString)

    connectionStringToCopy.pathname = selectedResourceName

    copy(connectionStringToCopy.toString())
    setIsCopied(true)

    timeoutRef.current = setTimeout(() => {
      setIsCopied(false)
      timeoutRef.current = null
    }, 3000)
  }

  const { data: version, isPending: isVersionPending, refetch: refetchVersion, isRefetching: isVersionRefetching } = useQuery(connectionVersionQuery(connection))

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
            <Tooltip>
              <TooltipTrigger asChild>
                <ConnectionIcon
                  type={connection.type}
                  className="pointer-events-auto size-6 shrink-0"
                />
              </TooltipTrigger>
              <TooltipContent side="left" className="pointer-events-auto">
                <span className="opacity-50">Version: </span>
                {isVersionPending
                  ? <span className="animate-pulse">Loading version...</span>
                  : version
                    ? (
                        <>
                          {isVersionRefetching && (
                            <Spinner className="size-3" />
                          )}
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => refetchVersion()}
                          >
                            {version}
                          </button>
                        </>
                      )
                    : <span className="opacity-50">Version cannot be detected</span>}
              </TooltipContent>
            </Tooltip>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 leading-none font-medium">
                <span title={connection.name}>{connection.name}</span>
                {' '}
                {connection.label && (
                  <Badge variant="outline">
                    {connection.label}
                  </Badge>
                )}
                {/* {' '}
                {isSyncing && <Spinner className="size-3" />}
                {syncError && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <RiAlertLine className="
                        pointer-events-auto size-3 text-warning
                      "
                      />
                    </TooltipTrigger>
                    <TooltipContent className="pointer-events-auto">
                      Sync failed:
                      {' '}
                      <p className="text-xs text-warning">{syncError.message}</p>
                    </TooltipContent>
                  </Tooltip>
                )} */}
              </div>
              <div className="pointer-events-auto flex h-5 items-center gap-1">
                <Tooltip open={isOpen || isCopied} onOpenChange={setIsOpen}>
                  <TooltipTrigger
                    className="
                      group flex cursor-pointer items-center gap-1 text-xs
                      text-muted-foreground
                    "
                    onClick={() => handleCopy()}
                  >
                    {connectionStringToShow}
                    {(showSystemName || fetchedResources.length > 1) && <span>/</span>}
                    {fetchedResources.length <= 1 && showSystemName && selectedResourceName}
                  </TooltipTrigger>
                  <TooltipContent className="flex items-center gap-1" side="bottom">
                    {isCopied ? 'Connection string copied!' : 'Copy connection string'}
                  </TooltipContent>
                </Tooltip>
                {fetchedResources.length > 1 && (
                  <Combobox
                    items={fetchedResources}
                    value={selectedResourceName}
                    onValueChange={value => connectionStore.set(state => ({ ...state, lastOpenedResourceName: value } satisfies typeof state))}
                  >
                    <ComboboxTrigger
                      className="text-xs"
                      render={<Button variant="outline" size="xs" />}
                    >
                      {selectedResourceName}
                      <RiArrowDownSLine />
                    </ComboboxTrigger>
                    <ComboboxPopup className="max-w-80 min-w-48">
                      {fetchedResources.length > 10 && (
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
                      )}
                      <ComboboxEmpty>No results found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item: typeof fetchedResources[number]) => (
                          <ComboboxItem
                            key={item}
                            className="group"
                          >
                            <span
                              className="
                                flex w-full min-w-0 items-center justify-between
                                gap-2
                              "
                            >
                              <span className="flex-1 truncate">
                                {item}
                              </span>
                              {fetchedResources.length > 10 && (
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="
                                    -mr-3 shrink-0 opacity-0
                                    group-hover:opacity-100
                                  "
                                >
                                  <RiPushpinLine className="size-3.5" />
                                </Button>
                              )}
                            </span>
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxPopup>
                  </Combobox>
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
              {/* <DropdownMenuItem
                onClick={() => sync()}
              >
                <RiLoopLeftLine className="size-4 opacity-50" />
                Refresh
              </DropdownMenuItem> */}
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
