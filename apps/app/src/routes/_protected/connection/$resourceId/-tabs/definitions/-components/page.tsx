import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { pseudoRandom, uppercaseFirst } from '@tamery/shared/utils/helpers'
import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { Button } from '@tamery/ui/components/button'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import { Drawer, DrawerContent } from '@tamery/ui/components/drawer'
import { Label } from '@tamery/ui/components/label'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import { copy as copyToClipboard } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { getRouteApi } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { CSSProperties, ComponentType, ReactNode } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu } from '~/components/app-context-menu'
import { PaneEmpty } from '~/components/pane-empty'
import { capabilitiesOf } from '~/entities/connection/capabilities'

import { useDefinitionMutation } from '../-hooks/use-definition-mutation'
import type { DefinitionsState } from '../-hooks/use-definitions-state'
import type { CellContext, DefinitionsColumn } from '../-lib/columns'
import type { InspectorProps } from './inspector'
import { SchemaSelect } from './schema-select'

const SKELETON_ROWS = 6
const SKELETON_MIN_WIDTH = 40
const SKELETON_WIDTH_RANGE = 45
const HOUSE_EASE = [0.32, 0.72, 0, 1] as const
const SWAP_FADE = 0.12

const { useNavigate, useSearch } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const columnClass = ({ align }: Pick<DefinitionsColumn<unknown>, 'align'>) =>
  cn('truncate', align === 'end' && 'text-right')

const alwaysDroppable = () => true

const SkeletonRows = <T,>({ columns }: { columns: DefinitionsColumn<T>[] }) =>
  Array.from({ length: SKELETON_ROWS }, (_, row) => (
    <TableRow
      // oxlint-disable-next-line react/no-array-index-key
      key={`skeleton-${row}`}
      className="hover:bg-transparent"
    >
      {columns.map((column, index) => (
        <TableCell key={column.header} className={columnClass(column)}>
          <Skeleton
            className={cn(
              'h-3 w-(--bar-width) rounded-full',
              column.align === 'end' && 'ml-auto'
            )}
            style={
              {
                '--bar-width': `${SKELETON_MIN_WIDTH + pseudoRandom(row * columns.length + index) * SKELETON_WIDTH_RANGE}%`,
              } as CSSProperties
            }
          />
        </TableCell>
      ))}
    </TableRow>
  ))

// A link lands on the tab and the drawer at once; the drawer waits out the
// tab's cross-fade so the two do not animate over each other.
const LINKED_OPEN_DELAY = 80

const useInspector = <T,>({
  items,
  keyOf,
}: {
  items: T[]
  keyOf: (item: T) => string
}) => {
  const navigate = useNavigate()
  const linkedKey = useSearch({ select: (current) => current.open })
  const [inspected, setInspected] = useState<{
    item: T | null
    open: boolean
    session: number
  }>({ item: null, open: false, session: 0 })
  const linkedItem = linkedKey
    ? items.find((item) => keyOf(item) === linkedKey)
    : undefined

  const openLinked = useEffectEvent(() => {
    if (!linkedItem) {
      return
    }
    setInspected((current) => ({
      item: linkedItem,
      open: true,
      session: current.session + 1,
    }))
    navigate({
      replace: true,
      search: (current) => ({
        ...current,
        open: undefined,
        schema: undefined,
      }),
    })
  })
  const linkedReady = Boolean(linkedItem)

  useEffect(() => {
    if (!linkedReady) {
      return
    }
    const timeout = setTimeout(openLinked, LINKED_OPEN_DELAY)

    return () => clearTimeout(timeout)
  }, [linkedReady])

  return {
    close: () => setInspected((current) => ({ ...current, open: false })),
    inspected,
    open: (item: T | null) =>
      setInspected((current) => ({
        item,
        open: true,
        session: current.session + 1,
      })),
  }
}

export const DefinitionsPage = <T extends { name: string }, P extends object>({
  canCascade = false,
  canDropItem = alwaysDroppable,
  columns,
  dropItem,
  icon,
  inSchema,
  Inspector,
  inspectorProps,
  items,
  keyOf,
  loading,
  noun,
  queryKey,
  rowMenu,
  state,
  title,
  toolbar,
}: {
  canCascade?: boolean
  canDropItem?: (item: T) => boolean
  columns: DefinitionsColumn<T>[]
  dropItem: (item: T, cascade: boolean) => Promise<unknown>
  icon: IconSvgElement
  inSchema: number
  Inspector: ComponentType<
    InspectorProps<T> & P & { queryKey: readonly unknown[] }
  >
  inspectorProps: P
  items: T[]
  keyOf: (item: T) => string
  loading: boolean
  noun: string
  queryKey: readonly unknown[]
  rowMenu?: (item: T) => AppMenuNode[]
  state: DefinitionsState
  title: string
  toolbar?: ReactNode
}) => {
  const {
    can,
    schemas,
    search,
    selectedSchema,
    setSearch,
    setSelectedSchema,
    type,
  } = state
  const searchRef = useRef<HTMLInputElement>(null)
  const rowsRef = useRef(new Map<string, HTMLTableRowElement>())
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const inspector = useInspector({ items, keyOf })
  const [dropping, setDropping] = useState<{ item: T | null; open: boolean }>({
    item: null,
    open: false,
  })
  const [cascade, setCascade] = useState(false)
  const cascadable = canCascade && capabilitiesOf(type).cascade

  const highlightedIndex = items.findIndex(
    (item) => keyOf(item) === highlighted
  )
  const highlightedItem =
    highlightedIndex === -1 ? null : items[highlightedIndex]
  const canDrop = (item: T) => !!can.drop && canDropItem(item)
  const overlayOpen = inspector.inspected.open || dropping.open
  const inspectedItem = inspector.inspected.item
  const empty = !loading && items.length === 0
  const context: CellContext = { schema: selectedSchema, search }
  const plural = title.toLowerCase()

  const dropMutation = useDefinitionMutation({
    mutationFn: (item: T) => dropItem(item, cascade),
    onSuccess: () => {
      setDropping((current) => ({ ...current, open: false }))
      inspector.close()
    },
    queryKey,
    success: (item) => `${uppercaseFirst(noun)} "${item.name}" dropped`,
  })

  const requestDrop = (item: T) => {
    dropMutation.reset()
    setCascade(false)
    setDropping({ item, open: true })
  }

  const moveHighlight = (delta: number) => {
    if (items.length === 0) {
      return
    }
    const fallback = delta > 0 ? 0 : items.length - 1
    const next =
      highlightedIndex === -1
        ? fallback
        : Math.min(items.length - 1, Math.max(0, highlightedIndex + delta))
    const item = items[next]

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
          const item = highlightedItem ?? items[0]
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
        options: { enabled: !overlayOpen && !!can.create },
      },
      {
        callback: () => {
          if (highlightedItem && canDrop(highlightedItem)) {
            requestDrop(highlightedItem)
          }
        },
        hotkey: 'Mod+D',
        options: { enabled: !overlayOpen && !!can.drop },
      },
    ],
    { conflictBehavior: 'replace', preventDefault: true }
  )

  const rowMenuItems = (item: T): AppMenuNode[] => [
    {
      label: can.edit ? 'Edit' : 'Inspect',
      onSelect: () => inspector.open(item),
    },
    {
      label: 'Copy name',
      onSelect: () =>
        copyToClipboard(item.name, `${uppercaseFirst(noun)} name copied`),
    },
    ...(rowMenu?.(item) ?? []),
    ...(canDrop(item)
      ? ([
          { type: 'separator' },
          {
            label: `Drop ${noun}`,
            onSelect: () => requestDrop(item),
            variant: 'destructive',
          },
        ] satisfies AppMenuNode[])
      : []),
  ]

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-baseline gap-2 text-base font-semibold">
          {title}
          {loading ? (
            <Skeleton className="h-3 w-5 self-center rounded-full" />
          ) : (
            <NumberFlow
              value={items.length}
              className="text-muted-foreground text-sm font-normal tabular-nums"
            />
          )}
        </h2>
        {can.create && (
          <Button variant="outline" onClick={() => inspector.open(null)}>
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Add {noun}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <SearchInput
          ref={searchRef}
          className="flex-1"
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
              title={inSchema === 0 ? `No ${plural}` : 'No matches'}
              description={
                inSchema === 0
                  ? `This schema has no ${plural}.`
                  : `No ${plural} match the current search and filters.`
              }
            />
          ) : (
            <div className="bg-popover ring-foreground/4 overflow-hidden rounded-xl shadow-xs ring">
              <Table className="min-w-xl table-fixed">
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead
                        key={column.header}
                        className={cn(column.width, columnClass(column))}
                      >
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <SkeletonRows columns={columns} />}
                  {items.map((item) => {
                    const key = keyOf(item)

                    return (
                      <AppContextMenu
                        key={key}
                        items={() => rowMenuItems(item)}
                        render={
                          // oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                          <TableRow
                            ref={(element) => {
                              if (element) {
                                rowsRef.current.set(key, element)
                              } else {
                                rowsRef.current.delete(key)
                              }
                            }}
                            data-highlighted={
                              (searchFocused && highlighted === key) ||
                              undefined
                            }
                            className="data-highlighted:bg-foreground/7 transition-none"
                            onClick={() => {
                              setHighlighted(key)
                              inspector.open(item)
                            }}
                          />
                        }
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={column.header}
                            className={columnClass(column)}
                          >
                            {column.cell(item, context)}
                          </TableCell>
                        ))}
                      </AppContextMenu>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <Drawer
        open={inspector.inspected.open}
        size="sm"
        swipeDirection="right"
        onOpenChange={(open) => {
          if (!open) {
            inspector.close()
          }
        }}
      >
        <DrawerContent
          className="sm:[--drawer-content-width:36rem]!"
          finalFocus={searchRef}
        >
          <Inspector
            key={inspector.inspected.session}
            item={inspectedItem}
            queryKey={queryKey}
            onOpenChange={(open) => {
              if (!open) {
                inspector.close()
              }
            }}
            {...inspectorProps}
          />
        </DrawerContent>
      </Drawer>
      <AlertDialog
        open={dropping.open}
        onOpenChange={(open) =>
          setDropping((current) => ({ ...current, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drop {noun}?</AlertDialogTitle>
            <AlertDialogDescription>
              <span data-mask className="text-foreground font-medium">
                {dropping.item?.name}
              </span>{' '}
              will be removed from the database. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cascadable && (
            <Label className="font-normal">
              <Checkbox
                checked={cascade}
                onCheckedChange={(checked) => setCascade(checked === true)}
              />
              Also drop objects that depend on it (CASCADE)
            </Label>
          )}
          <AnimatePresence initial={false}>
            {dropMutation.error && (
              <MotionCollapse key="drop-error">
                <Alert variant="destructive">
                  <AlertDescription data-mask className="wrap-break-word">
                    {dropMutation.error.message}
                  </AlertDescription>
                </Alert>
              </MotionCollapse>
            )}
          </AnimatePresence>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={dropMutation.isPending}
              onClick={() => {
                if (dropping.item) {
                  dropMutation.mutate(dropping.item)
                }
              }}
            >
              <LoadingContent loading={dropMutation.isPending}>
                Drop {noun}
              </LoadingContent>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
