import type { ComponentProps } from 'react'
import type { QueryLog } from '../query'
import type { databases } from '~/drizzle'
import { sleep } from '@conar/shared/utils/helpers'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { ButtonGroup } from '@conar/ui/components/button-group'
import { CardTitle } from '@conar/ui/components/card'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Label } from '@conar/ui/components/label'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { useVirtual } from '@conar/ui/hooks/use-virtual'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownLine, RiCheckboxCircleLine, RiCheckLine, RiCloseCircleLine, RiCloseLine, RiDeleteBinLine, RiFileListLine, RiTimeLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useEffect, useMemo, useState } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Monaco } from '~/components/monaco'
import { formatSql } from '~/lib/formatter'
import { databaseStore } from '~/routes/(protected)/_protected/database/-store'
import { queriesLogStore } from '../query'

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
        'cursor-pointer w-full flex items-center gap-2 justify-between border-t py-1 px-4 hover:bg-muted/50',
        className,
      )}
      {...props}
    >
      <span className="text-xs text-muted-foreground text-left tabular-nums">
        {query.createdAt.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })}
      </span>
      {getStatusIcon(status)}
      <Badge
        variant="secondary"
        className="text-xs"
      >
        {query.label}
      </Badge>
      <code className="text-xs font-mono flex-1 truncate text-left">
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

function Log({ query, className, database }: { query: QueryLog, className?: string, database: typeof databases.$inferSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const [canInteract, setCanInteract] = useState(false)

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
      <PopoverTrigger asChild>
        <LogTrigger
          query={query}
          className={cn(className, isOpen && 'bg-accent/30')}
          onMouseLeave={closePopover}
        />
      </PopoverTrigger>
      <PopoverContent
        className="flex gap-4 w-[95vw]"
        onAnimationEnd={closePopover}
      >
        <div className="flex-1 min-w-0 space-y-2">
          <div className="space-y-2">
            <Label>Query</Label>
            <Monaco
              value={formatSql(query.query, database.type)}
              language="sql"
              options={monacoOptions}
              className="h-[50vh] border rounded-md overflow-hidden"
            />
          </div>
          {query.values && query.values.length > 0 && (
            <div className="space-y-2">
              <Label>Values</Label>
              <pre className="bg-accent/50 p-2 rounded text-xs font-mono overflow-x-auto">
                {formatValues(query.values)}
              </pre>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {!!query.result && (
            <div className="space-y-2">
              <Label>Result</Label>
              <Monaco
                value={JSON.stringify(query.result)}
                language="json"
                options={monacoOptions}
                className="h-[50vh] border rounded-md overflow-hidden"
              />
            </div>
          )}
          {query.error && (
            <div className="space-y-2">
              <Label className="text-destructive">Error</Label>
              <pre className="bg-red-50 dark:bg-red-950 p-2 rounded text-xs font-mono overflow-x-auto text-red-700 dark:text-red-300">
                {query.error}
              </pre>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function QueryLogger({ database, className }: {
  database: typeof databases.$inferSelect
  className?: string
}) {
  const { scrollRef, contentRef, scrollToBottom, isNearBottom } = useStickToBottom({ initial: 'instant' })
  const queries = useStore(queriesLogStore, state => Object.values(state[database.id] || {}).toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime()))
  const [statusGroup, setStatusGroup] = useState<QueryStatus>()
  const [isClearing, setIsClearing] = useState(false)
  const store = databaseStore(database.id)

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
    queriesLogStore.setState(state => ({
      ...state,
      [database.id]: {},
    } satisfies typeof state))
  }

  const toggleGroup = (status: QueryStatus) => {
    setStatusGroup(prev => prev === status ? undefined : status)
  }

  const { virtualItems, totalSize } = useVirtual({
    count: filteredQueries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 31,
    overscan: 5,
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.setProperty('--scroll-top-offset', `${virtualItems[0]?.start ?? 0}px`)
      scrollRef.current.style.setProperty('--scroll-bottom-offset', `${totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)}px`)
    }
  }, [scrollRef, virtualItems, totalSize])

  return (
    <div className={cn('flex flex-col justify-between h-full', className)}>
      <div className="flex items-center justify-between py-2 px-4">
        <div className="flex items-center gap-2">
          <CardTitle>
            Query Logger
          </CardTitle>
          <ButtonGroup>
            <Button
              size="xs"
              variant="outline"
              className={cn('text-success!', statusGroup === 'success' && 'bg-accent!')}
              onClick={() => toggleGroup('success')}
            >
              <RiCheckboxCircleLine className="size-3" />
              {statusCounts.success}
            </Button>
            <Button
              size="xs"
              variant="outline"
              className={cn('text-destructive!', statusGroup === 'error' && 'bg-accent!')}
              onClick={() => toggleGroup('error')}
            >
              <RiCloseCircleLine className="size-3" />
              {statusCounts.error}
            </Button>
            <Button
              size="xs"
              variant="outline"
              className={cn('text-warning!', statusGroup === 'pending' && 'bg-accent!')}
              onClick={() => toggleGroup('pending')}
            >
              <RiTimeLine className="size-3" />
              {statusCounts.pending}
            </Button>
          </ButtonGroup>
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
            onClick={() => store.setState(state => ({ ...state, loggerOpened: false } satisfies typeof state))}
          >
            <RiCloseLine className="size-4" />
          </Button>
        </div>
      </div>
      <ScrollArea
        ref={scrollRef}
        className={cn(
          'min-h-0 relative',
          filteredQueries.length === 0 && 'flex flex-col items-center justify-center py-12',
        )}
      >
        {filteredQueries.length === 0 && (
          <>
            <div className="mb-3">
              <RiFileListLine className="size-10 text-muted-foreground/30" />
            </div>
            <p className="text-base font-medium text-muted-foreground mb-1">No queries yet</p>
          </>
        )}
        <div ref={contentRef} style={{ height: `${totalSize}px` }}>
          <div className="h-(--scroll-top-offset)" />
          {virtualItems.map(virtualItem => (
            <Log
              key={virtualItem.key}
              query={filteredQueries[virtualItem.index]!}
              database={database}
            />
          ))}
          <div className="h-(--scroll-bottom-offset)" />
        </div>
        <div className="sticky bottom-0 h-0">
          <Button
            className={cn('absolute bottom-2 left-1/2 -translate-x-1/2', isNearBottom ? 'opacity-0 pointer-events-none' : '')}
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
