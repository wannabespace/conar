import type { DragEndEvent } from '@dnd-kit/core'
import type { ComponentProps, RefObject } from 'react'
import type { Database } from '~/lib/indexeddb'
import { getOS } from '@conar/shared/utils/os'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useAsyncEffect } from '@conar/ui/hookas/use-async-effect'
import { useInViewport } from '@conar/ui/hookas/use-in-viewport'
import { useInitializedEffect } from '@conar/ui/hookas/use-initialized-effect'
import { useLocalStorage } from '@conar/ui/hookas/use-local-storage'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { clickHandlers, cn } from '@conar/ui/lib/utils'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiCloseLine, RiTableLine } from '@remixicon/react'
import { useParams, useRouter } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { prefetchDatabaseTableCore } from '~/entities/database'
import { getTableStoreState } from '../tables.$schema/$table'

interface Tab {
  table: string
  schema: string
  preview: boolean
}

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
  const { schema: schemaParam, table: tableParam } = useParams({ strict: false })
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useInViewport(ref, 'full')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const isActive = schemaParam === item.tab.schema && tableParam === item.tab.table

  useLayoutEffect(() => {
    if (!isVisible && isActive && ref.current) {
      onFocus(ref)
    }
  }, [isActive])

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
        {...clickHandlers(() => router.navigate({
          to: '/database/$id/tables/$schema/$table',
          params: { id, schema: item.tab.schema, table: item.tab.table },
        }))}
        onDoubleClick={onDoubleClick}
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

export function TablesTabs({ ref, database, id }: {
  ref?: RefObject<{ addTab: (schema: string, table: string) => void } | null>
  database: Database
  id: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { schema: schemaParam, table: tableParam } = useParams({ strict: false })
  const router = useRouter()
  const [tabs, setTabs] = useLocalStorage<Tab[]>(`database-tables-tabs-${id}`, [])

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
      addTab(schemaParam, tableParam, true)
    }
  }, [schemaParam, tableParam])

  function addTab(schema: string, table: string, preview?: boolean) {
    if (preview) {
      const existingPreviewTabIndex = tabs.findIndex(tab => tab.preview)

      if (existingPreviewTabIndex !== -1) {
        setTabs(prev => prev.map((tab, index) => index === existingPreviewTabIndex ? { table, schema, preview: true } : tab))
        return
      }

      setTabs(prev => [...prev, { table, schema, preview: true }])
      return
    }

    if (!tabs.find(tab => tab.table === table && tab.schema === schema && !tab.preview)) {
      setTabs(prev => prev.map(tab => tab.table === table && tab.schema === schema ? { table, schema, preview: false } : tab))
    }
  }

  useAsyncEffect(async () => {
    for (const tab of tabs) {
      await prefetchDatabaseTableCore(database, tab.schema, tab.table, getQueryOpts(tab.table))
    }
  }, [database, tabs])

  useInitializedEffect(() => {
    ref!.current = {
      addTab,
    }
  }, [ref, addTab])

  function getQueryOpts(tableName: string) {
    const state = schemaParam ? getTableStoreState(schemaParam, tableName) : null

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
        to: '/database/$id/tables/$schema/$table',
        params: { id, schema: prevTab.schema, table: prevTab.table },
      })
    }
    else {
      router.navigate({
        to: '/database/$id/tables',
        params: { id },
      })
    }
  }

  useMountedEffect(() => {
    navigateToAvailableRoute()
  }, [tabs.length])

  function closeTab(schema: string, table: string) {
    setTabs(tabs => tabs.filter(tab => !(tab.table === table && tab.schema === schema)))
  }

  useKeyboardEvent(e => e.key === 'w' && (os.type === 'macos' ? e.metaKey : e.ctrlKey), (e) => {
    e.preventDefault()

    if (schemaParam && tableParam) {
      closeTab(schemaParam, tableParam)
    }
  })

  const isOneSchema = useMemo(() => tabs.length
    ? tabs.every(tab => tab.schema === tabs[0]?.schema) && schemaParam === tabs[0]?.schema
    : true, [tabs, schemaParam])

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      setTabs((items) => {
        const oldIndex = items.findIndex(item => item.table === active.id)
        const newIndex = items.findIndex(item => item.table === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
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
              onClose={() => closeTab(item.tab.schema, item.tab.table)}
              onDoubleClick={() => addTab(item.tab.schema, item.tab.table, false)}
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
