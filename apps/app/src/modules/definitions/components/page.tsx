import {
  Copy01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { uppercaseFirst } from '@tamery/shared/utils'
import { Button } from '@tamery/ui/components/button'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import { Drawer, DrawerContent } from '@tamery/ui/components/drawer'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { copy as copyToClipboard } from '@tamery/ui/lib/copy'
import { useHotkeys } from '@tanstack/react-hotkeys'
import type { QueryKey } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import type { ComponentType, ReactNode } from 'react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import type { AppMenuNode } from '~/components/app-menu'
import { PaneEmpty } from '~/components/pane-empty'
import { capabilitiesOf } from '~/core/catalog/capabilities'
import { DropDialog } from '~/core/catalog/drop-dialog'
import { queryClient } from '~/lib/query-client'

import type { DefinitionsState } from '../hooks/use-definitions-state'
import { useInspector } from '../hooks/use-inspector'
import type { CellContext, DefinitionsColumn } from '../lib/columns'
import { sectionMetaOf } from '../section-meta'
import { DefinitionsTable } from './definitions-table'
import type { SectionInspectorProps } from './inspector'
import { SchemaSelect } from './schema-select'

const HOUSE_EASE = [0.32, 0.72, 0, 1] as const
const SWAP_FADE = 0.12

export const DefinitionsPage = <T extends { name: string }>({
  canDropItem,
  columns,
  createBlocked: blockReason,
  dropItem,
  Inspector,
  items,
  keyOf,
  loading,
  match,
  queryKey,
  rowMenu,
  state,
  toolbar,
}: {
  canDropItem?: (item: T) => boolean
  columns: DefinitionsColumn<T>[]
  createBlocked?: ReactNode
  dropItem: (item: T, cascade: boolean) => Promise<unknown>
  Inspector: ComponentType<SectionInspectorProps<T>>
  items: T[]
  keyOf: (item: T) => string
  loading: boolean
  match: (item: T) => boolean
  queryKey: QueryKey
  rowMenu?: (item: T) => AppMenuNode[]
  state: DefinitionsState
  toolbar?: ReactNode
}) => {
  const {
    can,
    schemas,
    search,
    section,
    selectedSchema,
    setSearch,
    setSelectedSchema,
    structurePending,
    type,
  } = state
  const createBlocked = structurePending ? undefined : blockReason
  const { cascade: cascades, icon, noun, title } = sectionMetaOf(section)
  const rows = items.filter(match)
  const searchRef = useRef<HTMLInputElement>(null)
  const rowsRef = useRef(new Map<string, HTMLTableRowElement>())
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const inspector = useInspector({
    items: rows,
    keepSchema: setSelectedSchema,
    keyOf,
    loading,
  })
  const [dropping, setDropping] = useState<{ item: T | null; open: boolean }>({
    item: null,
    open: false,
  })
  const [cascade, setCascade] = useState(false)
  const cascadable = cascades && capabilitiesOf(type).cascade

  const highlightedIndex = rows.findIndex((item) => keyOf(item) === highlighted)
  const highlightedItem: T | undefined = rows[highlightedIndex]
  const canDrop = (item?: T): item is T =>
    !!item && !!can.drop && (canDropItem?.(item) ?? true)
  const canCreate = !!can.create && !!selectedSchema && !createBlocked
  const overlayOpen = inspector.inspected.open || dropping.open
  const empty = !loading && rows.length === 0
  const context: CellContext = { schema: selectedSchema, search }
  const plural = title.toLowerCase()
  const addNote = can.create
    ? createBlocked
    : `Tamery can’t add ${plural} to this database yet.`

  const dropMutation = useMutation({
    meta: { event: 'definition_dropped' },
    mutationFn: (item: T) => dropItem(item, cascade),
    onSuccess: async (_result, item) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(`${uppercaseFirst(noun)} "${item.name}" dropped`)
      setDropping((current) => ({ ...current, open: false }))
      inspector.close()
    },
  })

  const closeInspector = (open: boolean) => {
    if (!open) {
      inspector.close()
    }
  }

  const requestDrop = (item: T) => {
    dropMutation.reset()
    setCascade(false)
    setDropping({ item, open: true })
  }

  const moveHighlight = (delta: number) => {
    const item =
      highlightedIndex === -1
        ? rows.at(delta > 0 ? 0 : -1)
        : rows[Math.min(rows.length - 1, Math.max(0, highlightedIndex + delta))]

    if (item) {
      const key = keyOf(item)
      setHighlighted(key)
      rowsRef.current.get(key)?.scrollIntoView({ block: 'nearest' })
    }
  }

  useHotkeys(
    [
      { callback: () => moveHighlight(1), hotkey: 'ArrowDown' },
      { callback: () => moveHighlight(-1), hotkey: 'ArrowUp' },
      {
        callback: () => {
          const item = highlightedItem ?? rows[0]
          if (item) {
            inspector.open(item)
          }
        },
        hotkey: 'Enter',
      },
      {
        callback: () => {
          if (search) {
            setSearch('')
            return
          }
          searchRef.current?.blur()
        },
        hotkey: 'Escape',
      },
    ],
    { enabled: !overlayOpen, preventDefault: true, target: searchRef }
  )

  useHotkeys(
    [
      {
        callback: () => inspector.open(null),
        hotkey: 'Mod+N',
        options: { enabled: !overlayOpen && canCreate },
      },
      {
        callback: () => {
          if (canDrop(highlightedItem)) {
            requestDrop(highlightedItem)
          }
        },
        hotkey: 'Mod+D',
        options: { enabled: !overlayOpen && canDrop(highlightedItem) },
      },
    ],
    { preventDefault: true }
  )

  const rowMenuItems = (item: T): AppMenuNode[] => [
    {
      icon: can.edit ? PencilEdit01Icon : ViewIcon,
      label: can.edit ? 'Edit' : 'Inspect',
      onSelect: () => inspector.open(item),
    },
    {
      icon: Copy01Icon,
      label: 'Copy name',
      onSelect: () =>
        copyToClipboard(item.name, `${uppercaseFirst(noun)} name copied`),
    },
    ...(rowMenu?.(item) ?? []),
    ...(canDrop(item)
      ? ([
          { type: 'separator' },
          {
            icon: Delete02Icon,
            label: `Drop ${noun}`,
            onSelect: () => requestDrop(item),
            variant: 'destructive',
          },
        ] satisfies AppMenuNode[])
      : []),
  ]

  const addButton = (
    <Tooltip
      shortcut={
        canCreate && (
          <KbdCtrlLetter userAgent={navigator.userAgent} letter="N" />
        )
      }
    >
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            disabled={!canCreate}
            onClick={() => inspector.open(null)}
          />
        }
      >
        <HugeiconsIcon
          icon={PlusSignIcon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Add {noun}
      </TooltipTrigger>
      <TooltipContent side="bottom">New {noun}</TooltipContent>
    </Tooltip>
  )

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-baseline gap-2 text-base font-semibold">
          {title}
          {loading ? (
            <Skeleton className="h-3 w-5 self-center rounded-full" />
          ) : (
            <NumberFlow
              value={rows.length}
              className="text-muted-foreground text-sm font-normal tabular-nums"
            />
          )}
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-xs text-pretty empty:hidden">
            {addNote}
          </p>
          {can.create && addButton}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SearchInput
          ref={searchRef}
          data-mask
          className="flex-1"
          aria-label={`Search ${plural}`}
          placeholder={`Search ${plural}`}
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {toolbar}
        <SchemaSelect
          schemas={schemas}
          selectedSchema={selectedSchema}
          setSelectedSchema={setSelectedSchema}
        />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={empty ? 'empty' : 'list'}
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0 } }}
          transition={{ duration: SWAP_FADE, ease: HOUSE_EASE }}
        >
          {empty ? (
            <PaneEmpty
              icon={icon}
              title={items.length === 0 ? `No ${plural}` : 'No matches'}
              description={
                items.length === 0
                  ? `This schema has no ${plural}.`
                  : `No ${plural} match the current search and filters.`
              }
            />
          ) : (
            <DefinitionsTable
              columns={columns}
              context={context}
              highlighted={searchFocused ? highlighted : null}
              keyOf={keyOf}
              loading={loading}
              menuOf={rowMenuItems}
              rows={rows}
              rowsRef={rowsRef}
              onOpen={(item) => {
                setHighlighted(keyOf(item))
                inspector.open(item)
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <Drawer
        open={inspector.inspected.open}
        size="sm"
        swipeDirection="right"
        onOpenChange={closeInspector}
      >
        <DrawerContent
          className="sm:[--drawer-content-width:36rem]!"
          finalFocus={searchRef}
        >
          <Inspector
            key={inspector.inspected.session}
            {...state}
            item={inspector.item}
            preset={inspector.inspected.preset}
            queryKey={queryKey}
            onOpenChange={closeInspector}
          />
        </DrawerContent>
      </Drawer>
      <DropDialog
        cascadable={cascadable}
        cascade={cascade}
        error={dropMutation.error}
        name={dropping.item?.name}
        noun={noun}
        open={dropping.open}
        pending={dropMutation.isPending}
        onCascadeChange={setCascade}
        onOpenChange={(open) =>
          setDropping((current) => ({ ...current, open }))
        }
        onDrop={() => {
          if (dropping.item) {
            dropMutation.mutate(dropping.item)
          }
        }}
      />
    </>
  )
}
