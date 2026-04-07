import type { ComponentProps } from 'react'
import type { QueryLog } from '../log'
import type { connectionsResources } from '~/drizzle/schema'
import { sleep } from '@conar/shared/utils/helpers'
import { Button } from '@conar/ui/components/button'
import { CardTitle } from '@conar/ui/components/card'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { Group, GroupSeparator } from '@conar/ui/components/group'
import { Label } from '@conar/ui/components/label'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { ScrollArea } from '@conar/ui/components/scroll-area'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownLine, RiCheckboxCircleLine, RiCheckLine, RiCloseCircleLine, RiCloseLine, RiDeleteBinLine, RiFileListLine, RiTimeLine } from '@remixicon/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Monaco } from '~/components/monaco'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { formatSql } from '~/lib/formatter'
import { queryLogsStore } from '../log'
import { connectionsCollection } from '../sync'

type QueryStatus = 'error' | 'success' | 'pending'

function getStatusIcon(status: QueryStatus) {
  if (status === 'success') {
    return <RiCheckboxCircleLine className="size-4 text-success" />
  }
  else if (status === 'error') {
    return <RiCloseCircleLine className="size-4 text-destructive" />
  }

  return <RiTimeLine className="size-4 text-warning" />
}

function getQueryStatus(query: QueryLog) {
  if (query.error)
    return 'error'
  if (query.result !== null)
    return 'success'
  return 'pending'
}

function LogTrigger({ query, className, ...props }: { query: QueryLog } & ComponentProps<'button'>) {
  const status = getQueryStatus(query)
  const truncatedQuery = query.query.replaceAll('\n', ' ')
  const shortQuery = truncatedQuery.length > 500 ? `${truncatedQuery.substring(0, 500)}...` : truncatedQuery

  return (
    <button
      type="button"
      className={cn(
        `
          flex w-full cursor-pointer items-center justify-between gap-2 border-t
          px-4 py-1.5
          hover:bg-muted/50
        `,
        className,
      )}
      {...props}
    >
      <span className="text-left text-xs text-muted-foreground tabular-nums">
        {query.createdAt.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })}
      </span>
      {getStatusIcon(status)}
      <span className={`
        w-12 text-left text-xs text-muted-foreground tabular-nums
      `}
      >
        {query.duration ? `${query.duration.toFixed()}ms` : ''}
      </span>
      <code className="flex-1 truncate text-left font-mono text-xs">
        {shortQuery}
      </code>
    </button>
  )
}

const monacoOptions = {
  readOnly: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'off' as const,
  minimap: { enabled: false },
  folding: false,
}

function Log({ query, className, connectionResource }: { query: QueryLog, className?: string, connectionResource: typeof connectionsResources.$inferSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const [canInteract, setCanInteract] = useState(false)

  const connection = connectionsCollection.get(connectionResource.connectionId)!

  const formatValues = (values?: unknown[]) => {
    if (!values || values.length === 0)
      return ''
    return `[${values.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`
  }

  if (!canInteract) {
    return (
      <LogTrigger
        query={query}
        className={className}
        onMouseEnter={() => setCanInteract(true)}
      />
    )
  }

  function closePopover() {
    if (!isOpen) {
      sleep(200).then(() => setCanInteract(false))
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={(
        <LogTrigger
          query={query}
          className={cn(className, isOpen && 'bg-accent/30')}
          onMouseLeave={closePopover}
        />
      )}
      />
      <PopoverContent
        className="flex w-[95vw] flex-row gap-4"
        onAnimationEnd={closePopover}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-2">
            <Label>Query</Label>
            <Monaco
              value={formatSql(query.query, connection.type)}
              language="sql"
              options={monacoOptions}
              className="h-[50vh] overflow-hidden rounded-md border"
            />
          </div>
          {query.values && query.values.length > 0 && (
            <div className="space-y-2">
              <Label>Values</Label>
              <pre className={`
                overflow-x-auto rounded-sm bg-accent/50 p-2 font-mono text-xs
              `}
              >
                {formatValues(query.values)}
              </pre>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {!!query.result && (
            <div className="space-y-2">
              <Label>Result</Label>
              <Monaco
                value={JSON.stringify(query.result)}
                language="json"
                options={monacoOptions}
                className="h-[50vh] overflow-hidden rounded-md border"
              />
            </div>
          )}
          {query.error && (
            <div className="space-y-2">
              <Label className="text-destructive">Error</Label>
              <pre className={`
                overflow-x-auto rounded-sm bg-red-50 p-2 font-mono text-xs
                whitespace-break-spaces text-red-700
                dark:bg-red-950 dark:text-red-300
              `}
              >
                {query.error}
              </pre>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function QueryLogger({ connectionResource, className }: {
  connectionResource: typeof connectionsResources.$inferSelect
  className?: string
}) {
  const { scrollRef, contentRef, scrollToBottom, isNearBottom } = useStickToBottom({ initial: 'instant' })
  const queries = useSubscription(queryLogsStore, { selector: state => Object.values(state[connectionResource.id] || {}).toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) })
  const [statusGroup, setStatusGroup] = useState<QueryStatus>()
  const [isClearing, setIsClearing] = useState(false)
  const store = getConnectionResourceStore(connectionResource.id)

  const filteredQueries = useMemo(() => {
    if (statusGroup) {
      return queries.filter(query => getQueryStatus(query) === statusGroup)
    }
    return queries
  }, [queries, statusGroup])

  const statusCounts = queries.reduce((counts, query) => {
    if (query.error) {
      counts.error++
    }
    else if (query.result) {
      counts.success++
    }
    else {
      counts.pending++
    }
    return counts
  }, { success: 0, error: 0, pending: 0 })

  const clearQueries = () => {
    setIsClearing(true)
    queryLogsStore.set(state => ({
      ...state,
      [connectionResource.id]: {},
    } satisfies typeof state))
  }

  const toggleGroup = (status: QueryStatus) => {
    setStatusGroup(prev => prev === status ? undefined : status)
  }

  const { getVirtualItems, getTotalSize } = useVirtualizer({
    useFlushSync: false,
    count: filteredQueries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 29,
    overscan: 5,
  })

  const virtualItems = getVirtualItems()
  const totalSize = getTotalSize()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.setProperty('--scroll-top-offset', `${virtualItems[0]?.start ?? 0}px`)
      scrollRef.current.style.setProperty('--scroll-bottom-offset', `${totalSize - (virtualItems.at(-1)?.end ?? 0)}px`)
    }
  }, [scrollRef, virtualItems, totalSize])

  return (
    <div className={cn('flex h-full flex-col justify-between', className)}>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <CardTitle>
            Query Logger
          </CardTitle>
          <Group>
            <Button
              size="xs"
              variant="outline"
              className={cn('text-success!', statusGroup === 'success' && `
                bg-accent!
              `)}
              onClick={() => toggleGroup('success')}
            >
              <RiCheckboxCircleLine className="size-3" />
              {statusCounts.success}
            </Button>
            <GroupSeparator />
            <Button
              size="xs"
              variant="outline"
              className={cn('text-destructive!', statusGroup === 'error' && `
                bg-accent!
              `)}
              onClick={() => toggleGroup('error')}
            >
              <RiCloseCircleLine className="size-3" />
              {statusCounts.error}
            </Button>
            <GroupSeparator />
            <Button
              size="xs"
              variant="outline"
              className={cn('text-warning!', statusGroup === 'pending' && `
                bg-accent!
              `)}
              onClick={() => toggleGroup('pending')}
            >
              <RiTimeLine className="size-3" />
              {statusCounts.pending}
            </Button>
          </Group>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={clearQueries}
          >
            <ContentSwitch
              activeContent={<RiCheckLine className="size-4 text-success" />}
              active={isClearing}
              onSwitchEnd={setIsClearing}
            >
              <RiDeleteBinLine className="size-4 text-destructive" />
            </ContentSwitch>
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => store.set(state => ({ ...state, loggerOpened: false } satisfies typeof state))}
          >
            <RiCloseLine className="size-4" />
          </Button>
        </div>
      </div>
      <ScrollArea
        viewportRef={scrollRef}
        scrollFade
        className="relative min-h-0"
      >
        {filteredQueries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-3">
              <RiFileListLine className="size-10 text-muted-foreground/30" />
            </div>
            <p className="mb-1 text-base font-medium text-muted-foreground">No queries yet</p>
          </div>
        )}
        <div ref={contentRef} style={{ height: `${totalSize}px` }}>
          <div className="h-(--scroll-top-offset)" />
          {virtualItems.map(virtualItem => (
            <Log
              key={virtualItem.key}
              query={filteredQueries[virtualItem.index]!}
              connectionResource={connectionResource}
            />
          ))}
          <div className="h-(--scroll-bottom-offset)" />
        </div>
        <div className="sticky bottom-0 h-0">
          <Button
            className={cn('absolute bottom-2 left-1/2 -translate-x-1/2', isNearBottom
              ? `pointer-events-none opacity-0`
              : '')}
            variant="secondary"
            size="icon-sm"
            onClick={() => scrollToBottom()}
          >
            <RiArrowDownLine className="size-4" />
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}
