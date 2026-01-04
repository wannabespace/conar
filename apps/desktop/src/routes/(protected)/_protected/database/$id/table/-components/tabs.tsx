import type { ComponentProps, RefObject } from 'react'
import type { databases } from '~/drizzle'
import type { databaseStoreType } from '~/entities/database/store'
import { getOS, isCtrlAndKey } from '@conar/shared/utils/os'
import { ScrollArea, ScrollBar, ScrollViewport } from '@conar/ui/components/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useIsInViewport } from '@conar/ui/hookas/use-is-in-viewport'
import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiTableLine } from '@remixicon/react'
import { useRouter, useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { motion, Reorder } from 'motion/react'
import { useEffect, useEffectEvent, useRef } from 'react'
import { addTab, databaseStore, removeTab, updateTabs } from '~/entities/database/store'
import { prefetchDatabaseTableCore } from '~/entities/database/utils'
import { getPageStoreState } from '../-store'

const MotionScrollViewport = motion.create(ScrollViewport)

const os = getOS(navigator.userAgent)

function CloseButton({ onClick }: { onClick: (e: React.MouseEvent<SVGSVGElement>) => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RiCloseLine
            className={`
              size-3.5 opacity-0
              group-hover:opacity-30
              hover:opacity-100
            `}
            onClick={onClick}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={12}>
          Close tab (
          {os.type === 'macos' ? '⌘' : 'Ctrl'}
          {' '}
          + W)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function TabButton({
  className,
  children,
  active,
  onClose,
  ...props
}: ComponentProps<'button'> & {
  active: boolean
  onClose: () => void
}) {
  return (
    <button
      data-mask
      type="button"
      className={cn(
        `
          group flex h-full items-center gap-1 rounded-sm border
          border-transparent pr-1.5 pl-2 text-sm text-foreground
        `,
        'hover:border-accent hover:bg-muted/70',
        active && `
          border-primary/50 bg-primary/10
          hover:border-primary/50 hover:bg-primary/10
        `,
        className,
      )}
      {...props}
    >
      <RiTableLine
        className={cn(
          'size-4 shrink-0 text-muted-foreground opacity-50',
          active && 'text-primary opacity-100',
        )}
      />
      <span>
        {children}
      </span>
      <CloseButton
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
    </button>
  )
}

function SortableTab({
  id,
  item,
  showSchema,
  onClose,
  onDoubleClick,
  onMouseOver,
  onFocus,
}: {
  id: string
  item: { id: string, tab: typeof databaseStoreType.infer['tabs'][number] }
  showSchema: boolean
  onClose: () => void
  onDoubleClick: () => void
  onMouseOver: () => void
  onFocus: (ref: RefObject<HTMLDivElement | null>) => void
}) {
  const router = useRouter()
  const { schema: schemaParam, table: tableParam } = useSearch({ from: '/(protected)/_protected/database/$id/table/' })
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIsInViewport(ref, 'full')

  const isActive = schemaParam === item.tab.schema && tableParam === item.tab.table

  useEffect(() => {
    if (!isVisible && isActive && ref.current) {
      onFocus(ref)
    }
  }, [isActive, onFocus, isVisible])

  return (
    <Reorder.Item
      value={item}
      as="div"
      ref={ref}
      className={cn(
        `
          relative rounded-sm bg-background
          aria-pressed:z-10
        `,
        item.tab.preview && 'italic',
      )}
    >
      <TabButton
        active={schemaParam === item.tab.schema && tableParam === item.tab.table}
        onClose={onClose}
        onDoubleClick={onDoubleClick}
        onMouseOver={onMouseOver}
        onClick={() => router.navigate({
          to: '/database/$id/table',
          params: { id },
          search: { schema: item.tab.schema, table: item.tab.table },
        })}
      >
        {showSchema && (
          <span className="text-muted-foreground">
            {item.tab.schema}
            .
          </span>
        )}
        {item.tab.table}
      </TabButton>
    </Reorder.Item>
  )
}

export function TablesTabs({
  database,
  className,
}: {
  database: typeof databases.$inferSelect
  className?: string
}) {
  const { schema: schemaParam, table: tableParam } = useSearch({ from: '/(protected)/_protected/database/$id/table/' })
  const router = useRouter()
  const store = databaseStore(database.id)
  const tabs = useStore(store, state => state.tabs)

  const addNewTab = useEffectEvent((schema: string, table: string) => {
    const tab = tabs.find(tab => tab.table === table && tab.schema === schema)

    if (tab) {
      return
    }

    addTab(database.id, schema, table, true)
  })

  useEffect(() => {
    if (!schemaParam || !tableParam) {
      return
    }

    addNewTab(schemaParam, tableParam)
  }, [schemaParam, tableParam])

  function getQueryOpts(tableName: string) {
    const state = schemaParam ? getPageStoreState(database.id, schemaParam, tableName) : null

    if (state) {
      return {
        filters: state.filters,
        orderBy: state.orderBy,
      }
    }

    return {
      filters: [],
      orderBy: {},
    }
  }

  async function navigateToDifferentTabIfThisActive(schema: string, table: string) {
    // If this tab is not opened, do not navigate
    if (schemaParam !== schema || tableParam !== table) {
      return
    }

    const currentTabIndex = tabs.findIndex(tab => tab.schema === schema && tab.table === table)
    const nextTabIndex = currentTabIndex === tabs.length - 1 ? null : currentTabIndex + 1
    const prevTabIndex = currentTabIndex === 0 ? null : currentTabIndex - 1

    const newTab = nextTabIndex !== null || prevTabIndex !== null ? tabs[(nextTabIndex ?? prevTabIndex)!] : null

    if (newTab) {
      await router.navigate({
        to: '/database/$id/table',
        params: { id: database.id },
        search: { schema: newTab.schema, table: newTab.table },
      })
    }
    else {
      await router.navigate({
        to: '/database/$id/table',
        params: { id: database.id },
      })
    }
  }

  async function closeTab(schema: string, table: string) {
    await navigateToDifferentTabIfThisActive(schema, table)
    removeTab(database.id, schema, table)
  }

  useKeyboardEvent(e => isCtrlAndKey(e, 'w'), (e) => {
    e.preventDefault()

    if (schemaParam && tableParam) {
      closeTab(schemaParam, tableParam)
    }
  })

  const isOneSchema = tabs.length
    ? tabs.every(tab => tab.schema === tabs[0]?.schema) && schemaParam === tabs[0]?.schema
    : true

  const tabItems = tabs.map(tab => ({
    id: `${tab.schema}:${tab.table}`,
    tab,
  }))

  return (
    <ScrollArea>
      <MotionScrollViewport
        layoutScroll
        className={cn('flex gap-1 p-1', className)}
      >
        <Reorder.Group
          axis="x"
          values={tabItems}
          onReorder={(newItems) => {
            updateTabs(database.id, newItems.map(item => item.tab))
          }}
          className="flex gap-1"
        >
          {tabItems.map(item => (
            <SortableTab
              key={item.id}
              id={database.id}
              item={item}
              showSchema={!isOneSchema}
              onClose={() => closeTab(item.tab.schema, item.tab.table)}
              onDoubleClick={() => addTab(database.id, item.tab.schema, item.tab.table, false)}
              onMouseOver={() => prefetchDatabaseTableCore({ database, schema: item.tab.schema, table: item.tab.table, query: getQueryOpts(item.tab.table) })}
              onFocus={(ref) => {
                ref.current?.scrollIntoView({
                  block: 'nearest',
                  inline: 'nearest',
                })
              }}
            />
          ))}
        </Reorder.Group>
      </MotionScrollViewport>
      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  )
}
