import {
  Copy01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { pseudoRandom, uppercaseFirst } from '@tamery/shared/utils'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
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
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { CSSProperties, ComponentType, ReactNode } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu, AppMenuButton } from '~/components/app-context-menu'
import { PaneEmpty } from '~/components/pane-empty'
import { capabilitiesOf } from '~/entities/connection/capabilities'
import { sectionMetaOf } from '~/entities/connection/sections'
import { queryClient } from '~/lib/query-client'

import type { DefinitionsState } from '../-hooks/use-definitions-state'
import type { CellContext, DefinitionsColumn } from '../-lib/columns'
import type { SectionInspectorProps } from './inspector'

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

const SchemaSelect = ({
  schemas,
  selectedSchema,
  setSelectedSchema,
}: Pick<
  DefinitionsState,
  'schemas' | 'selectedSchema' | 'setSelectedSchema'
>) =>
  schemas.length > 1 && (
    <Select
      value={selectedSchema}
      onValueChange={(schema) => {
        if (schema) {
          setSelectedSchema(schema)
        }
      }}
    >
      <SelectTrigger data-mask className="max-w-56 min-w-45">
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <span className="text-muted-foreground shrink-0">schema</span>
          <span className="truncate">
            <SelectValue />
          </span>
        </div>
      </SelectTrigger>
      <SelectContent data-mask>
        {schemas.map((schema) => (
          <SelectItem key={schema} value={schema}>
            {schema}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

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
      <TableCell />
    </TableRow>
  ))

const LINKED_OPEN_DELAY = 80

const useInspector = <T,>({
  items,
  keepSchema,
  keyOf,
  loading,
}: {
  items: T[]
  keepSchema: (schema: string | undefined) => void
  keyOf: (item: T) => string
  loading: boolean
}) => {
  const navigate = useNavigate()
  const linkedKey = useSearch({ select: (current) => current.open })
  const linkedSchema = useSearch({ select: (current) => current.schema })
  const linkedPreset = useSearch({ select: (current) => current.create })
  const [inspected, setInspected] = useState<{
    item: T | null
    open: boolean
    preset?: string
    session: number
  }>({ item: null, open: false, session: 0 })
  const linkedItem = linkedKey
    ? items.find((item) => keyOf(item) === linkedKey)
    : undefined
  const open = (item: T | null, preset?: string) =>
    setInspected((current) => ({
      item,
      open: true,
      preset,
      session: current.session + 1,
    }))

  const openLinked = useEffectEvent(() => {
    if (linkedItem) {
      open(linkedItem)
    } else if (linkedPreset) {
      open(null, linkedPreset)
    }
    keepSchema(linkedSchema)
    navigate({
      replace: true,
      search: (current) => ({
        ...current,
        create: undefined,
        open: undefined,
        schema: undefined,
      }),
    })
  })

  const linked = !!(linkedKey || linkedPreset)

  useEffect(() => {
    if (!linked || loading) {
      return
    }
    const timeout = setTimeout(openLinked, LINKED_OPEN_DELAY)

    return () => clearTimeout(timeout)
  }, [linked, loading])

  // A toggle inside the drawer refetches the list, so the live row outranks
  // the snapshot the drawer opened on.
  const snapshot = inspected.item
  const liveItem =
    snapshot &&
    (items.find((item) => keyOf(item) === keyOf(snapshot)) ?? snapshot)

  return {
    close: () => setInspected((current) => ({ ...current, open: false })),
    inspected,
    item: liveItem,
    open,
  }
}

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
  queryKey: readonly unknown[]
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
    { conflictBehavior: 'replace', preventDefault: true }
  )

  const rowMenuItems = (item: T): AppMenuNode[] => [
    {
      label: can.edit ? 'Edit' : 'Inspect',
      icon: can.edit ? PencilEdit01Icon : ViewIcon,
      onSelect: () => inspector.open(item),
    },
    {
      label: 'Copy name',
      icon: Copy01Icon,
      onSelect: () =>
        copyToClipboard(item.name, `${uppercaseFirst(noun)} name copied`),
    },
    ...(rowMenu?.(item) ?? []),
    ...(canDrop(item)
      ? ([
          { type: 'separator' },
          {
            label: `Drop ${noun}`,
            icon: Delete02Icon,
            onSelect: () => requestDrop(item),
            variant: 'destructive',
          },
        ] satisfies AppMenuNode[])
      : []),
  ]

  const addButton = (
    <Button
      variant="outline"
      disabled={!canCreate}
      onClick={() => inspector.open(null)}
    >
      <HugeiconsIcon
        icon={PlusSignIcon}
        strokeWidth={2}
        data-icon="inline-start"
      />
      Add {noun}
    </Button>
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
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <SkeletonRows columns={columns} />}
                  {rows.map((item) => {
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
                            className="group/row data-highlighted:bg-foreground/7 transition-none"
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
                        <TableCell className="text-right">
                          <AppMenuButton
                            items={() => rowMenuItems(item)}
                            className="-my-0.5"
                          />
                        </TableCell>
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
