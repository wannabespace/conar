import type { ComponentRef } from 'react'
import type { connections, connectionsResources, connections as connectionsTable } from '~/drizzle/schema'
import { CONNECTION_TYPES_WITHOUT_SCHEMAS } from '@conar/shared/constants'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card, CardFrameDescription, CardFrameFooter, CardFrameHeader, CardFrameMotion, CardFrameTitle, CardPanel } from '@conar/ui/components/card'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Input } from '@conar/ui/components/input'
import { ScrollArea } from '@conar/ui/components/scroll-area'
import { Separator } from '@conar/ui/components/separator'
import { Spinner } from '@conar/ui/components/spinner'
import { Tabs, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiAddLine, RiAlertLine, RiCheckLine, RiCloseLine, RiDatabase2Line, RiDeleteBinLine, RiEditLine, RiFileCopyLine, RiLoopLeftLine, RiMoreLine } from '@remixicon/react'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { ConnectionIcon } from '~/entities/connection/components'
import { useConnectionResourceLinkParams } from '~/entities/connection/hooks'
import { resourceTablesAndSchemasQuery } from '~/entities/connection/queries'
import { connectionVersionQuery } from '~/entities/connection/queries/connection-version'
import { connectionsCollection, connectionsResourcesCollection, syncConnectionResources } from '~/entities/connection/sync'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils'
import { LastOpenedResources } from './last-opened-resources'
import { RemoveConnectionDialog } from './remove-connection-dialog'
import { RenameConnectionDialog } from './rename-connection-dialog'

function ResourceCard({ resource, connection, search }: {
  resource: typeof connectionsResources.$inferSelect
  connection: typeof connections.$inferSelect
  search: string
}) {
  const params = useConnectionResourceLinkParams(resource.id)
  const { data: tablesAndSchemas } = useQuery({
    ...resourceTablesAndSchemasQuery({ connectionResource: resource, showSystem: false, silent: true }),
    throwOnError: false,
  })

  return (
    <Link
      className="
        group flex flex-1 items-center justify-between gap-2 rounded-md px-2
        py-1.5 text-sm text-foreground
        hover:bg-accent/30
      "
      {...params}
    >
      <div className="flex min-w-0 items-center gap-2">
        <RiDatabase2Line className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate" title={resource.name}>
          {search ? <HighlightText text={resource.name} match={search} /> : resource.name}
        </span>
        {tablesAndSchemas && (
          <div className="
            mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground
          "
          >
            <span className="whitespace-nowrap">
              {tablesAndSchemas.totalTables}
              {' '}
              table
              {tablesAndSchemas?.totalTables === 1 ? '' : 's'}
            </span>
            {!CONNECTION_TYPES_WITHOUT_SCHEMAS.includes(connection.type) && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <span className="whitespace-nowrap">
                  {tablesAndSchemas?.totalSchemas}
                  {' '}
                  schema
                  {tablesAndSchemas?.totalSchemas === 1 ? '' : 's'}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

function ConnectionCard({
  connection,
  onRemove,
  onRename,
}: {
  connection: typeof connectionsTable.$inferSelect
  onRemove: VoidFunction
  onRename: VoidFunction
}) {
  const connectionString = new SafeURL(connection.connectionString)
  connectionString.pathname = ''
  const connectionStringToShow = `${connectionString.hostname}${connectionString.port ? `:${connectionString.port}` : ''}`
  const [isCopied, setIsCopied] = useState(false)
  const [resourcesSearch, setResourcesSearch] = useState('')

  const { mutate: sync, isPending: isSyncing, error: syncError } = useMutation({
    mutationFn: async () => {
      await syncConnectionResources(connection)
    },
  })

  useEffect(() => {
    sync()
  }, [sync])

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    copy(connectionString.toString())
    setIsCopied(true)

    timeoutRef.current = setTimeout(() => {
      setIsCopied(false)
      timeoutRef.current = null
    }, 3000)
  }

  const { data: version, isPending: isVersionPending, refetch: refetchVersion, isRefetching: isVersionRefetching } = useQuery(connectionVersionQuery(connection))
  const { data: resources } = useLiveQuery(q => q
    .from({ connectionsResources: connectionsResourcesCollection })
    .where(({ connectionsResources }) => eq(connectionsResources.connectionId, connection.id)), [connection.id])

  const filteredResources = resources.filter(resource =>
    !resourcesSearch
    || resource.name.toLowerCase().includes(resourcesSearch.toLowerCase()),
  )

  return (
    <CardFrameMotion
      layout="position"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      style={connection.color ? { '--color': connection.color } : {}}
    >
      <CardFrameHeader className="
        flex flex-row items-center justify-between gap-4
      "
      >
        <div className="flex min-w-0 items-center gap-4">
          <ConnectionIcon
            type={connection.type}
            className="size-6 shrink-0"
          />
          <div className="flex min-w-0 flex-col">
            <CardFrameTitle className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate" title={connection.name}>{connection.name}</span>
              {' '}
              {isSyncing && <Spinner className="size-3" />}
              {syncError && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <RiAlertLine className="size-3 text-warning" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Sync failed:
                      {' '}
                      <p className="text-xs text-warning">{syncError.message}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardFrameTitle>
            <CardFrameDescription
              className="
                group flex cursor-pointer items-center justify-between gap-2
              "
              render={<button type="button" />}
              onClick={() => handleCopy()}
            >
              <span className="group flex min-w-0 flex-1 gap-2">
                <span className="min-w-0 flex-1 truncate">
                  {connectionStringToShow}
                </span>

              </span>
              <ContentSwitch
                active={isCopied}
                activeContent={<RiCheckLine className="size-4 text-success" />}
                onSwitchEnd={() => setIsCopied(false)}
              >
                <RiFileCopyLine className="
                  size-3 opacity-0 transition-opacity
                  group-hover:opacity-100
                "
                />
              </ContentSwitch>
            </CardFrameDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className={`
            rounded-md p-2
            hover:bg-accent-foreground/5
          `}
          >
            <RiMoreLine className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => sync()}
            >
              <RiLoopLeftLine className="size-4 opacity-50" />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRename()}
            >
              <RiEditLine className="size-4 opacity-50" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className={`
                text-destructive
                focus:text-destructive
              `}
              onClick={() => onRemove()}
            >
              <RiDeleteBinLine className="size-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFrameHeader>
      <Card>
        <CardPanel className="-mx-2">
          {resources.length > 5 && (
            <div className="relative mb-2 px-2">
              <Input
                placeholder={`Search resources (${resources.length})`}
                className="pr-8"
                value={resourcesSearch}
                onChange={e => setResourcesSearch(e.target.value)}
              />
              {resourcesSearch && (
                <button
                  type="button"
                  className={`
                    absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer p-1
                  `}
                  onClick={() => setResourcesSearch('')}
                >
                  <RiCloseLine className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
          <ScrollArea className="max-h-60" scrollFade>
            {filteredResources.length > 0
              ? (
                  <AnimatePresence mode="popLayout">
                    {filteredResources.map(resource => (
                      <motion.div
                        key={resource.id}
                        layout
                        transition={{ layout: { duration: 0.15, ease: 'easeInOut' } }}
                      >
                        <ResourceCard
                          resource={resource}
                          connection={connection}
                          search={resourcesSearch}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )
              : (
                  <div
                    className="
                      flex items-center p-2 text-sm text-muted-foreground
                    "
                  >
                    {isSyncing
                      ? (
                          <div className="flex animate-pulse items-center gap-2">
                            <Spinner className="size-3" />
                            Syncing resources...
                          </div>
                        )
                      : resources && resources.length > 0
                        ? 'No resources match your search'
                        : 'No resources found'}
                  </div>
                )}
          </ScrollArea>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    disabled
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                  >
                    <RiAddLine className="size-4" />
                    Add Resource
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                Soon you will be able to add resources to your connection.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardPanel>
      </Card>
      <CardFrameFooter>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            {connection.color && (
              <div className="size-5 rounded-full bg-(--color)" />
            )}
            {connection.label && (
              <Badge variant="outline">
                {connection.label}
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground">
            {isVersionPending
              ? (
                  <span className="animate-pulse">Loading version...</span>
                )
              : version
                ? (
                    <button
                      className={cn('flex items-center gap-1', isVersionRefetching
                        ? `animate-pulse`
                        : '')}
                      type="button"
                      onClick={() => refetchVersion()}
                    >
                      {isVersionRefetching && (
                        <Spinner className="size-3" />
                      )}
                      Version:
                      {' '}
                      {version}
                    </button>
                  )
                : (
                    <span className="opacity-50">
                      Version cannot be detected
                    </span>
                  )}
          </div>
        </div>
      </CardFrameFooter>
    </CardFrameMotion>
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

  const renameDialogRef = useRef<ComponentRef<typeof RenameConnectionDialog>>(null)
  const removeDialogRef = useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)
  const lastOpenedResources = useSubscription(lastOpenedResourcesStorageValue)

  const availableLabels = [...new Set(data.map(connection => connection.label).filter(Boolean) as string[])].toSorted()
  const showLastOpened = lastOpenedResources.length > 0 && data.length > 1

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      <RenameConnectionDialog ref={renameDialogRef} />
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
                  onRename={() => {
                    renameDialogRef.current?.rename(connection)
                  }}
                />
              ))
            : <Empty />}
        </AnimatePresence>
      </div>
    </div>
  )
}
