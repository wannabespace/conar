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
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
} from '@tamery/ui/components/item'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@tamery/ui/components/resizable'
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

type QueryStatus = 'error' | 'pending' | 'success'

const DETAILS_PANEL_ID = 'query-logger-details'

const ROW_HEIGHT = 28
const PREVIEW_LIMIT = 20_000

const statusDots = {
  error: 'bg-destructive',
  pending: 'bg-warning',
  success: 'bg-success',
} as const

const timeFormat = {
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  second: '2-digit',
} as const

const getQueryStatus = ({ error, result }: QueryLog): QueryStatus => {
  if (error) {
    return 'error'
  }

  return result === null ? 'pending' : 'success'
}

const singleLine = (query: string) =>
  query.replaceAll(/\s+/gu, ' ').trim().slice(0, 300)

const preview = (value: unknown) => {
  const json = JSON.stringify(value, null, 2)

  return json.length > PREVIEW_LIMIT
    ? `${json.slice(0, PREVIEW_LIMIT)}\n…`
    : json
}

const resultLabel = (result: unknown) =>
  Array.isArray(result) ? `Result · ${result.length}` : 'Result'

const LogRow = ({
  isActive,
  onSelect,
  query,
}: {
  isActive: boolean
  onSelect: () => void
  query: QueryLog
}) => {
  const dot = statusDots[getQueryStatus(query)]

  return (
    <Item
      size="xs"
      render={<button type="button" aria-label="Inspect query" />}
      data-active={isActive || undefined}
      onClick={onSelect}
      className="hover:bg-accent data-active:bg-accent hover:data-active:bg-accent data-active:before:bg-primary relative h-7 flex-nowrap gap-2.5 rounded-none px-3 py-0 text-left transition-none before:absolute before:inset-y-0 before:left-0 before:w-[2px]"
    >
      <ItemMedia variant="icon">
        <span className={cn('size-1.5 rounded-full', dot)} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <CodeInline
          data-mask
          code={singleLine(query.query)}
          language="sql"
          className="truncate text-xs"
        />
      </ItemContent>
      <ItemActions className="text-2xs text-muted-foreground/70 gap-3 tabular-nums">
        <span className="w-12 text-right">
          {query.duration === null ? '' : `${Math.round(query.duration)} ms`}
        </span>
        <span>{query.createdAt.toLocaleTimeString('en-US', timeFormat)}</span>
      </ItemActions>
    </Item>
  )
}

const QueryDetails = ({
  connectionType,
  onClose,
  query,
}: {
  connectionType: ConnectionType
  onClose: () => void
  query: QueryLog
}) => {
  const tabs = [
    {
      code: formatSql(query.query, connectionType),
      label: 'Query',
      language: 'sql',
      value: 'query',
    },
    ...(query.error
      ? [
          {
            code: query.error,
            label: 'Error',
            language: 'text',
            value: 'error',
          },
        ]
      : []),
    ...(query.values.length > 0
      ? [
          {
            code: JSON.stringify(query.values),
            label: 'Values',
            language: 'json',
            value: 'values',
          },
        ]
      : []),
    ...(query.result === null
      ? []
      : [
          {
            code: preview(query.result),
            label: resultLabel(query.result),
            language: 'json',
            value: 'result',
          },
        ]),
  ]
  const [activeTab, setActiveTab] = useState(query.error ? 'error' : 'query')
  const active = tabs.find((tab) => tab.value === activeTab) ?? tabs[0]

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as string)}
      className="flex h-full min-h-0 flex-col gap-0"
    >
      <div className="flex h-8 shrink-0 items-center gap-1 border-b pr-1 pl-2">
        <TabsList variant="line" className="mr-auto gap-1 p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-muted-foreground data-active:text-foreground after:bg-primary! flex-none px-1.5 text-xs group-data-horizontal/tabs:after:bottom-0"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {active && (
          <Tooltip>
            <TooltipTrigger
              render={
                <CopyButton
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Copy"
                  className="text-muted-foreground"
                  text={active.code}
                  copyIcon={<RiFileCopyLine className="size-3.5" />}
                  successIcon={
                    <RiCheckLine className="text-success size-3.5" />
                  }
                />
              }
            />
            <TooltipContent side="bottom">Copy {active.label}</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Close query details"
                className="text-muted-foreground"
                onClick={onClose}
              />
            }
          >
            <RiCloseLine className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Close details</TooltipContent>
        </Tooltip>
      </div>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="min-h-0 flex-1 scrollbar-thin overflow-auto"
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
      ))}
    </Tabs>
  )
}

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
    useFlushSync: false,
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
          `absolute inset-x-0 bottom-2 mx-auto shadow-xs transition-shadow hover:shadow-md`,
          isNearBottom && 'pointer-events-none opacity-0'
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
  const [isClearing, setIsClearing] = useState(false)
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `query-logger-layout-${connectionResource.id}`,
    onlySaveAfterUserInteractions: true,
    storage: localStorage,
  })

  const selected = queries.find((query) => query.id === selectedId)

  if (selected && selected !== shown) {
    setShown(selected)
  }

  const clearQueries = () => {
    setIsClearing(true)
    queryLogsStore.set(
      (state) =>
        ({ ...state, [connectionResource.id]: {} }) satisfies typeof state
    )
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="flex h-8 shrink-0 items-center gap-1 border-b pr-1 pl-3">
        <span className="text-sm font-medium">Query Logger</span>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Clear log"
                className="ml-auto"
                disabled={queries.length === 0}
                onClick={clearQueries}
              />
            }
          >
            <ContentSwitch
              active={isClearing}
              onSwitchEnd={setIsClearing}
              activeContent={<RiCheckLine className="text-success size-3.5" />}
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
                onClick={() =>
                  store.set(
                    (state) =>
                      ({ ...state, loggerOpened: false }) satisfies typeof state
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
            className="[&>div]:bg-border/50 aria-disabled:w-0"
            disabled={!selected}
          />
          <ResizablePanel
            id={DETAILS_PANEL_ID}
            collapsed={!selected}
            defaultSize="45%"
            minSize="25%"
            maxSize="70%"
          >
            {shown && connection && (
              <QueryDetails
                key={shown.id}
                query={shown}
                connectionType={connection.type}
                onClose={() => setSelectedId(undefined)}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  )
}
