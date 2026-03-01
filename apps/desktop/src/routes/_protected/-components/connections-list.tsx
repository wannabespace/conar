import type { ComponentRef } from 'react'
import type { connections, connectionsResources, connections as connectionsTable } from '~/drizzle'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card, CardFrameDescription, CardFrameFooter, CardFrameHeader, CardFrameMotion, CardFrameTitle, CardPanel } from '@conar/ui/components/card'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { ScrollArea, ScrollBar, ScrollViewport } from '@conar/ui/components/scroll-area'
import { Separator } from '@conar/ui/components/separator'
import { Tabs, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useIsScrolled } from '@conar/ui/hookas/use-is-scrolled'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiAddLine, RiCheckLine, RiCloseLine, RiDatabase2Line, RiDeleteBinLine, RiEditLine, RiFileCopyLine, RiLoader4Line, RiMoreLine } from '@remixicon/react'
import { eq, inArray, useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { ConnectionIcon } from '~/entities/connection/components'
import { useConnectionResourceLinkParams } from '~/entities/connection/hooks'
import { resourceTablesAndSchemasQuery, useConnectionResources } from '~/entities/connection/queries'
import { connectionVersionQuery } from '~/entities/connection/queries/connection-version'
import { connectionsCollection, connectionsResourcesCollection } from '~/entities/connection/sync'
import { useLastOpenedResources } from '~/entities/connection/utils'
import { RemoveConnectionDialog } from './remove-connection-dialog'
import { RenameConnectionDialog } from './rename-connection-dialog'

function ResourceCard({ resource, connection }: { resource: typeof connectionsResources.$inferSelect, connection: typeof connections.$inferSelect }) {
  const params = useConnectionResourceLinkParams(resource.id)
  const { data: tablesAndSchemas } = useQuery({
    ...resourceTablesAndSchemasQuery({ connectionResource: resource, showSystem: false, silent: true }),
    throwOnError: false,
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        className="
          flex items-center justify-between gap-2 rounded-md p-2 text-sm
          text-foreground
          hover:bg-accent/30
        "
        {...params}
      >
        <div className="flex items-center gap-2">
          <RiDatabase2Line className="size-4 text-muted-foreground" />
          <span>{resource.name}</span>
        </div>
        {tablesAndSchemas && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {tablesAndSchemas.totalTables}
              {' '}
              table
              {tablesAndSchemas?.totalTables === 1 ? '' : 's'}
            </span>
            {connection.type !== ConnectionType.ClickHouse && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <span>
                  {tablesAndSchemas?.totalSchemas}
                  {' '}
                  schema
                  {tablesAndSchemas?.totalSchemas === 1 ? '' : 's'}
                </span>
              </>
            )}
          </div>
        )}
      </Link>
    </motion.div>
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
  const [isCopied, setIsCopied] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const isScrolled = useIsScrolled(scrollViewportRef)

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
  const { data: resources, isPending: isResourcesPending } = useConnectionResources(connection)

  return (
    <CardFrameMotion
      layout
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
            <CardFrameTitle className="flex gap-2">{connection.name}</CardFrameTitle>
            <CardFrameDescription
              className="
                group flex cursor-pointer items-center justify-between gap-2
              "
              render={<button type="button" />}
              onClick={() => handleCopy()}
            >
              <span className="group flex min-w-0 flex-1 gap-2">
                <span className="min-w-0 flex-1 truncate">
                  {connectionString.toMasked()}
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
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onRename()
              }}
            >
              <RiEditLine className="size-4 opacity-50" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className={`
                text-destructive
                focus:text-destructive
              `}
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
            >
              <RiDeleteBinLine className="size-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFrameHeader>
      <Card>
        <CardPanel className="-mx-2">
          <ScrollArea className={cn(
            `
              relative
              after:pointer-events-none after:absolute after:inset-x-0
              after:bottom-0 after:z-10 after:h-4
              after:bg-linear-to-t after:from-card after:to-transparent
            `,
            isScrolled && `
              before:pointer-events-none before:absolute before:top-0
              before:inset-x-0 before:z-10 before:h-4
              before:bg-linear-to-b before:from-card before:to-transparent
            `,
          )}
          >
            <ScrollViewport ref={scrollViewportRef} className="max-h-40">
              <AnimatePresence initial={false} mode="popLayout">
                {isResourcesPending
                  ? (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={`
                          flex animate-pulse items-center gap-2 p-2 text-sm
                          text-muted-foreground
                        `}
                      >
                        <RiLoader4Line className="size-4 animate-spin" />
                        Loading resources...
                      </motion.div>
                    )
                  : resources.length > 0
                    ? resources.map(resource => (
                        <ResourceCard
                          key={resource.id}
                          resource={resource}
                          connection={connection}
                        />
                      ))
                    : (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="
                            flex items-center p-2 text-sm text-muted-foreground
                          "
                        >
                          No resources found
                        </motion.div>
                      )}
              </AnimatePresence>
            </ScrollViewport>
            <ScrollBar />
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
                        <RiLoader4Line className="size-3 animate-spin" />
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
      <Button asChild>
        <Link to="/create">
          Create a new connection
        </Link>
      </Button>
    </div>
  )
}

function LastOpenedResource({ connectionResource, connection, onClose }: { connectionResource: typeof connectionsResources.$inferSelect, connection: typeof connections.$inferSelect, onClose: VoidFunction }) {
  const params = useConnectionResourceLinkParams(connectionResource.id)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between gap-2"
    >
      <Link
        className="
          flex flex-1 items-center gap-2 py-0.5 text-sm text-foreground
          hover:underline
        "
        preload={false}
        {...params}
      >
        <ConnectionIcon
          type={connection.type}
          className="size-4"
        />
        {connection.name}
        {' '}
        /
        {connectionResource.name}
      </Link>
      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0"
        onClick={onClose}
      >
        <RiCloseLine className="text-muted-foreground" />
      </Button>
    </motion.div>
  )
}

function LastOpenedResources() {
  const [lastOpenedResources, setLastOpenedResources] = useLastOpenedResources()
  const { data } = useLiveQuery(q => q
    .from({ connectionsResources: connectionsResourcesCollection })
    .innerJoin(
      { connections: connectionsCollection },
      ({ connectionsResources, connections }) => eq(connectionsResources.connectionId, connections.id),
    )
    .select(({ connectionsResources, connections }) => ({
      connectionResource: connectionsResources,
      connection: connections,
    }))
    .where(({ connectionsResources }) => inArray(connectionsResources.id, lastOpenedResources))
    .orderBy(({ connectionsResources }) => connectionsResources.createdAt, 'desc'), [lastOpenedResources])

  if (data.length === 0) {
    return null
  }

  const close = (resource: typeof connectionsResources.$inferSelect) => {
    setLastOpenedResources(prev => prev.filter(id => id !== resource.id))
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Last Opened</h3>
      <div className="flex flex-col gap-1">
        <AnimatePresence initial={false} mode="popLayout">
          {data.map(({ connectionResource, connection }) => (
            <LastOpenedResource
              key={connectionResource.id}
              connectionResource={connectionResource}
              connection={connection}
              onClose={() => close(connectionResource)}
            />
          ))}
        </AnimatePresence>
      </div>
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
  const [lastOpenedResources] = useLastOpenedResources()

  const availableLabels = Array.from(new Set(data.map(connection => connection.label).filter(Boolean) as string[])).sort()

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
        {data.length > 0
          ? (
              <AnimatePresence initial={false} mode="popLayout">
                {data.map(connection => (
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
                ))}
              </AnimatePresence>
            )
          : <Empty />}
      </div>
    </div>
  )
}
