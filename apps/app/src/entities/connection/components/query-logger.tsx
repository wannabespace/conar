import {
  RiArrowDownLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiFileListLine,
} from '@remixicon/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { Button } from '@tamery/ui/components/button'
import { CodeBlock, CodeInline } from '@tamery/ui/components/custom/code-block'
import { ContentSwitch } from '@tamery/ui/components/custom/content-switch'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@tamery/ui/components/resizable'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@tamery/ui/components/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useVirtualizer } from '@tamery/ui/hooks/use-virtualizer'
import { cn } from '@tamery/ui/lib/utils'
import { useState } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { useSubscription } from 'seitu/react'
import { useStickToBottom } from 'use-stick-to-bottom'

import { useCollections } from '~/entities/collections'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { formatSql } from '~/utils/formatter'

import type { ConnectionResource } from '../core/sync'
import type { QueryLog } from '../runtime/log'
import { queryLogsStore } from '../runtime/log'

const DETAILS_PANEL_ID = 'query-logger-details'

const ROW_HEIGHT = 28
const PREVIEW_LIMIT = 20_000

// Success is the common case, so it stays neutral — a column of green dots
// only competes with the highlighted SQL beside it.
const statusIndicator = ({ error, result }: QueryLog) => {
  if (error) {
    return <span className="bg-destructive size-1.5 rounded-full" />
  }

  if (result === null) {
    return <Spinner className="text-muted-foreground size-3" />
  }

  return <span className="bg-foreground/20 size-1.5 rounded-full" />
}

const StatusDot = (query: QueryLog) => (
  <span className="flex w-3 shrink-0 justify-center">
    {statusIndicator(query)}
  </span>
)

const preview = (value: unknown) => {
  const json = JSON.stringify(value, null, 2)

  return json.length > PREVIEW_LIMIT
    ? `${json.slice(0, PREVIEW_LIMIT)}\n…`
    : json
}

const LogRow = ({
  isActive,
  onSelect,
  query,
}: {
  isActive: boolean
  onSelect: () => void
  query: QueryLog
}) => (
  <button
    type="button"
    aria-label="Inspect query"
    data-active={isActive || undefined}
    onClick={onSelect}
    className="hover:bg-accent data-active:bg-foreground/10 hover:data-active:bg-foreground/10 focus-visible:ring-ring/50 flex h-7 w-full items-center gap-2.5 px-3 text-left text-sm outline-none focus-visible:ring-[3px]"
  >
    <StatusDot {...query} />
    <CodeInline
      data-mask
      code={query.query}
      language="sql"
      className="min-w-0 flex-1 truncate text-xs"
    />
    <span className="text-2xs text-muted-foreground/70 flex items-center gap-3 tabular-nums">
      <span className="w-12 text-right">
        {query.duration === null ? '' : `${Math.round(query.duration)} ms`}
      </span>
      <span>
        {query.createdAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          hour12: false,
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
    </span>
  </button>
)

interface DetailTab {
  code: string
  label: string
  language: string
  value: string
}

const buildTabs = (query: QueryLog, connectionType: ConnectionType) =>
  [
    {
      code: formatSql(query.query, connectionType),
      label: 'Query',
      language: 'sql',
      value: 'query',
    },
    {
      code: query.error,
      label: 'Error',
      language: 'text',
      value: 'error',
    },
    {
      code: query.values.length > 0 ? preview(query.values) : null,
      label: 'Values',
      language: 'json',
      value: 'values',
    },
    {
      code: query.result === null ? null : preview(query.result),
      label: Array.isArray(query.result)
        ? `Result · ${query.result.length}`
        : 'Result',
      language: 'json',
      value: 'result',
    },
  ].filter((tab): tab is DetailTab => tab.code !== null)

const QueryDetails = ({ tab }: { tab: DetailTab }) => (
  <TabsContent
    key={tab.value}
    value={tab.value}
    className="no-scrollbar scroll-fade min-h-0 flex-1 overflow-auto"
  >
    <CodeBlock
      className={cn(
        'my-0 rounded-none bg-transparent',
        tab.value === 'error' && 'text-destructive'
      )}
      code={tab.code}
      collapsible={false}
      header={false}
      language={tab.language}
    />
  </TabsContent>
)

const LogList = ({
  onSelect,
  queries,
  selectedId,
}: {
  onSelect: (id: string) => void
  queries: QueryLog[]
  selectedId?: string
}) => {
  const { contentRef, isNearBottom, scrollRef, scrollToBottom } =
    useStickToBottom({ initial: 'instant' })
  const { totalSize, virtualItems } = useVirtualizer({
    count: queries.length,
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => scrollRef.current,
    overscan: 5,
  })

  return (
    <div className="relative h-full min-h-0">
      <div
        ref={scrollRef}
        className="no-scrollbar scroll-fade h-full overflow-auto"
      >
        <div ref={contentRef}>
          <div style={{ height: virtualItems[0]?.start ?? 0 }} />
          {virtualItems.map((virtualItem) => {
            const query = queries[virtualItem.index]

            return query ? (
              <LogRow
                key={virtualItem.key}
                query={query}
                isActive={query.id === selectedId}
                onSelect={() => onSelect(query.id)}
              />
            ) : null
          })}
          <div
            style={{ height: totalSize - (virtualItems.at(-1)?.end ?? 0) }}
          />
        </div>
      </div>
      <Button
        className={cn(
          `absolute inset-x-0 bottom-2 mx-auto transition-all`,
          isNearBottom && 'pointer-events-none translate-y-4 opacity-0'
        )}
        variant="outline"
        size="icon-sm"
        aria-label="Scroll to latest"
        onClick={() => scrollToBottom()}
      >
        <RiArrowDownLine className="size-4" />
      </Button>
    </div>
  )
}

export const QueryLogger = ({
  className,
  connectionResource,
}: {
  className?: string
  connectionResource: ConnectionResource
}) => {
  const store = getConnectionResourceStore(connectionResource.id)
  const { connectionsCollection } = useCollections()
  const connection = connectionsCollection.get(connectionResource.connectionId)
  const queries = useSubscription(queryLogsStore, {
    selector: (state) =>
      Object.values(state[connectionResource.id] || {}).toSorted(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      ),
  })
  const [selectedId, setSelectedId] = useState<string>()
  const [shown, setShown] = useState<QueryLog>()
  const [tab, setTab] = useState('query')
  const [isClearing, setIsClearing] = useState(false)
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `query-logger-layout-${connectionResource.id}`,
    onlySaveAfterUserInteractions: true,
    storage: localStorage,
  })

  const selected = queries.find((query) => query.id === selectedId)

  if (selected && selected !== shown) {
    setShown(selected)

    if (selected.id !== shown?.id) {
      setTab(selected.error ? 'error' : 'query')
    }
  }

  const tabs = shown && connection ? buildTabs(shown, connection.type) : []
  const activeTab = tabs.find((item) => item.value === tab) ?? tabs.at(0)

  const clearQueries = () => {
    setIsClearing(true)
    queryLogsStore.set(
      (state) =>
        ({ ...state, [connectionResource.id]: {} }) satisfies typeof state
    )
  }

  return (
    <Tabs
      value={activeTab?.value ?? 'query'}
      onValueChange={(value) => setTab(value as string)}
      className={cn('flex h-full min-h-0 flex-col gap-0', className)}
    >
      <div className="flex h-8 shrink-0 items-center gap-1 border-b pr-1 pl-3">
        <span className="text-sm font-medium">Query Logger</span>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Clear log"
                  className="text-muted-foreground"
                  disabled={queries.length === 0}
                  onClick={clearQueries}
                />
              }
            >
              <ContentSwitch
                active={isClearing}
                onSwitchEnd={setIsClearing}
                activeContent={
                  <RiCheckLine className="text-success size-3.5" />
                }
              >
                <RiDeleteBinLine className="size-3.5" />
              </ContentSwitch>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear log</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Close query logger"
                  className="text-muted-foreground"
                  onClick={() =>
                    store.set(
                      (state) =>
                        ({
                          ...state,
                          loggerOpened: false,
                        }) satisfies typeof state
                    )
                  }
                />
              }
            >
              <RiCloseLine className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Close</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {queries.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiFileListLine />
            </EmptyMedia>
            <EmptyTitle>No queries yet</EmptyTitle>
            <EmptyDescription>
              Queries run against this connection show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 flex-1"
          defaultLayout={defaultLayout}
          onLayoutChanged={(layout, meta) => {
            onLayoutChanged(layout, meta)

            if (meta.isUserInteraction && layout[DETAILS_PANEL_ID] === 0) {
              setSelectedId(undefined)
            }
          }}
        >
          <ResizablePanel defaultSize="60%" minSize="30%">
            <LogList
              queries={queries}
              selectedId={selectedId}
              onSelect={(id) =>
                setSelectedId((current) => (current === id ? undefined : id))
              }
            />
          </ResizablePanel>
          <ResizableHandle
            className="[&>div]:bg-border w-px aria-disabled:w-0 [&>div]:w-full"
            disabled={!selected}
          />
          <ResizablePanel
            id={DETAILS_PANEL_ID}
            className="flex flex-col"
            collapsed={!selected}
            defaultSize="45%"
            minSize="25%"
            maxSize="70%"
          >
            {selected && activeTab && (
              <TabsList variant="bar" className="shrink-0 after:hidden">
                {tabs.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="flex-none tabular-nums transition-none"
                  >
                    {item.label}
                  </TabsTrigger>
                ))}
                <div className="flex flex-1 items-center justify-end border-b px-1">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <CopyButton
                          size="icon-xs"
                          variant="ghost"
                          aria-label="Copy"
                          className="text-muted-foreground"
                          text={activeTab.code}
                          copyIcon={<RiFileCopyLine className="size-3.5" />}
                          successIcon={
                            <RiCheckLine className="text-success size-3.5" />
                          }
                        />
                      }
                    />
                    <TooltipContent side="bottom">
                      Copy {activeTab.label}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TabsList>
            )}
            {activeTab && <QueryDetails tab={activeTab} />}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </Tabs>
  )
}
