import type { DragEndEvent } from '@dnd-kit/core'
import type { ComponentProps, RefObject } from 'react'
import type { Tab } from '../-tabs'
import type { databases } from '~/drizzle'
import { getOS } from '@conar/shared/utils/os'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useAsyncEffect } from '@conar/ui/hookas/use-async-effect'
import { useIsInViewport } from '@conar/ui/hookas/use-is-in-viewport'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { clickHandlers, cn } from '@conar/ui/lib/utils'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiCloseLine, RiTableLine } from '@remixicon/react'
import { useRouter, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useRef } from 'react'
import { prefetchDatabaseTableCore } from '~/entities/database'
import { getPageStoreState } from '../-store'
import { addTab, closeTab, moveTab, useTabs } from '../-tabs'

const os = getOS(navigator.userAgent)

function CloseButton({ onClick }: { onClick: (e: React.MouseEvent<SVGSVGElement>) => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RiCloseLine
            className="size-3.5 opacity-0 group-hover:opacity-30 hover:opacity-100"
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
        'group text-foreground flex h-full items-center gap-1 pl-2 pr-1.5 text-sm rounded-sm border border-transparent',
        'hover:bg-muted/70 hover:border-accent',
        active && 'bg-primary/10 border-primary/50 hover:bg-primary/10 hover:border-primary/50',
        className,
      )}
      {...props}
    >
      <RiTableLine
        className={cn(
          'size-4 text-muted-foreground shrink-0 opacity-50',
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
  onFocus,
}: {
  id: string
  item: { id: string, tab: Tab }
  showSchema: boolean
  onClose: () => void
  onDoubleClick: () => void
  onFocus: (ref: RefObject<HTMLDivElement | null>) => void
}) {
  const router = useRouter()
  const { schema: schemaParam, table: tableParam } = useSearch({ from: '/(protected)/_protected/database/$id/table/' })
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIsInViewport(ref, 'full')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const isActive = schemaParam === item.tab.schema && tableParam === item.tab.table

  useEffect(() => {
    if (!isVisible && isActive && ref.current) {
      onFocus(ref)
    }
  }, [isActive, onFocus, isVisible])

  return (
    <div
      ref={(e) => {
        setNodeRef(e)
        ref.current = e
      }}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        'bg-background aria-pressed:z-10 relative rounded-sm',
        item.tab.preview && 'italic',
      )}
      {...attributes}
      {...listeners}
    >
      <TabButton
        active={schemaParam === item.tab.schema && tableParam === item.tab.table}
        onClose={onClose}
        onDoubleClick={onDoubleClick}
        {...clickHandlers(() => router.navigate({
          to: '/database/$id/table',
          params: { id },
          search: { schema: item.tab.schema, table: item.tab.table },
        }))}
      >
        {showSchema && (
          <span className="text-muted-foreground">
            {item.tab.schema}
            .
          </span>
        )}
        {item.tab.table}
      </TabButton>
    </div>
  )
}

export function TablesTabs({ database }: {
  database: typeof databases.$inferSelect
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { schema: schemaParam, table: tableParam } = useSearch({ from: '/(protected)/_protected/database/$id/table/' })
  const router = useRouter()
  const tabs = useTabs(database.id)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  useEffect(() => {
    if (!schemaParam || !tableParam) {
      return
    }

    const tab = tabs.find(tab => tab.table === tableParam && tab.schema === schemaParam)

    if (!tab) {
      addTab(database.id, schemaParam, tableParam, true)
    }
  }, [tabs, database.id, schemaParam, tableParam])

  useAsyncEffect(async () => {
    for (const tab of tabs) {
      await prefetchDatabaseTableCore({ database, schema: tab.schema, table: tab.table, query: getQueryOpts(tab.table) })
    }
  }, [database, tabs])

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

  function navigateToAvailableRoute() {
    if (schemaParam && tableParam && tabs.find(tab => tab.schema === schemaParam && tab.table === tableParam)) {
      return
    }

    if (tabs.length) {
      const prevTab = tabs.at(-1)!

      router.navigate({
        to: '/database/$id/table',
        params: { id: database.id },
        search: { schema: prevTab.schema, table: prevTab.table },
      })
    }
    else {
      router.navigate({
        to: '/database/$id/table',
        params: { id: database.id },
      })
    }
  }

  useMountedEffect(() => {
    navigateToAvailableRoute()
  }, [tabs.length])

  useKeyboardEvent(e => e.key === 'w' && (os.type === 'macos' ? e.metaKey : e.ctrlKey), (e) => {
    e.preventDefault()

    if (schemaParam && tableParam) {
      closeTab(database.id, schemaParam, tableParam)
    }
  })

  const isOneSchema = useMemo(() => tabs.length
    ? tabs.every(tab => tab.schema === tabs[0]?.schema) && schemaParam === tabs[0]?.schema
    : true, [tabs, schemaParam])

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      moveTab(database.id, active.id, over.id)
    }
  }

  const tabItems = useMemo(() => tabs.map(tab => ({
    id: tab.table,
    tab,
  })), [tabs])

  return (
    <DndContext modifiers={[restrictToHorizontalAxis]} sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={tabItems} strategy={horizontalListSortingStrategy}>
        <ScrollArea ref={scrollRef} className="flex h-9 p-1 gap-1">
          {tabItems.map(item => (
            <SortableTab
              key={item.id}
              id={database.id}
              item={item}
              showSchema={!isOneSchema}
              onClose={() => closeTab(database.id, item.tab.schema, item.tab.table)}
              onDoubleClick={() => addTab(database.id, item.tab.schema, item.tab.table, false)}
              onFocus={(ref) => {
                ref.current?.scrollIntoView({
                  block: 'nearest',
                  inline: 'nearest',
                })
              }}
            />
          ))}
        </ScrollArea>
      </SortableContext>
    </DndContext>
  )
}
