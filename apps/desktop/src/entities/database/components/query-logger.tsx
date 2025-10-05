import type { QueryLog } from '../query'
import type { databases } from '~/drizzle'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { ButtonGroup } from '@conar/ui/components/button-group'
import { CardTitle } from '@conar/ui/components/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@conar/ui/components/collapsible'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { useVirtual } from '@conar/ui/hooks/use-virtual'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownLine, RiArrowDownSLine, RiArrowRightSLine, RiCheckboxCircleLine, RiCloseCircleLine, RiDeleteBinLine, RiFileListLine, RiTimeLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useMemo, useState } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Monaco } from '~/components/monaco'
import { formatSql } from '~/lib/formatter'
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

function Log({ query, className, database }: { query: QueryLog, className?: string, database: typeof databases.$inferSelect }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const status = getQueryStatus(query)
  const truncatedQuery = query.query.replaceAll('\n', ' ')
  const shortQuery = truncatedQuery.length > 500 ? `${truncatedQuery.substring(0, 500)}...` : truncatedQuery

  const formatValues = (values?: unknown[]) => {
    if (!values || values.length === 0)
      return ''
    return `[${values.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`
  }

  return (
    <div className={cn('border-t', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger
          className={cn(
            'cursor-pointer w-full flex items-center gap-2 justify-between p-1 hover:bg-muted/50',
            isExpanded && 'rounded-b-0',
          )}
        >
          {isExpanded
            ? <RiArrowDownSLine className="size-4 -mr-1" />
            : <RiArrowRightSLine className="size-4 -mr-1" />}
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
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 space-y-3 flex gap-2">
            <div className="flex-1">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Query</label>
                <Monaco
                  value={formatSql(query.query, database.type)}
                  language="sql"
                  options={{
                    readOnly: true,
                    scrollBeyondLastLine: false,
                    lineNumbers: 'off',
                    minimap: { enabled: false },
                    folding: false,
                  }}
                  className="h-[200px]"
                />
              </div>
              {query.values && query.values.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Values</label>
                  <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                    {formatValues(query.values)}
                  </pre>
                </div>
              )}
            </div>
            <div className="flex-1">
              {!!query.result && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Result</label>
                  <Monaco
                    value={JSON.stringify(query.result)}
                    language="json"
                    options={{
                      readOnly: true,
                      scrollBeyondLastLine: false,
                      lineNumbers: 'off',
                      minimap: { enabled: false },
                      folding: false,
                    }}
                    className="h-[200px]"
                  />
                </div>
              )}
              {query.error && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-destructive">Error</label>
                  <pre className="bg-red-50 dark:bg-red-950 p-2 rounded text-xs font-mono overflow-x-auto text-red-700 dark:text-red-300">
                    {query.error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export function QueryLogger({ database, className }: {
  database: typeof databases.$inferSelect
  className?: string
}) {
  const { scrollRef, contentRef, scrollToBottom, isNearBottom } = useStickToBottom({ initial: 'instant' })
  const queries = useStore(queriesLogStore, state => Object.values(state[database.id] || {}).toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime()))
  const [statusGroup, setStatusGroup] = useState<QueryStatus>()

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
    queriesLogStore.setState(state => ({
      ...state,
      [database.id]: {},
    }))
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

  const offsets = {
    top: virtualItems[0]?.start ?? 0,
    bottom: totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0),
  }

  if (scrollRef.current) {
    scrollRef.current.style.setProperty('--scroll-top-offset', `${offsets.top}px`)
    scrollRef.current.style.setProperty('--scroll-bottom-offset', `${offsets.bottom}px`)
  }

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
        <Button
          variant="outline"
          size="icon-sm"
          onClick={clearQueries}
        >
          <RiDeleteBinLine className="size-4 text-destructive" />
        </Button>
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
