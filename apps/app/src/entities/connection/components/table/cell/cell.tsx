import {
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sleep } from '@tamery/shared/utils/helpers'
import type { TableCellProps } from '@tamery/table'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { Button } from '@tamery/ui/components/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'
import { useState } from 'react'

import { createTransformer } from '~/entities/connection/transformers'

import { TableCellContent } from './cell-content'
import type { SaveStatus } from './cell-context'
import { useCellContext } from './cell-context'
import { TableCellContextMenu } from './cell-menu'
import { CellPopoverContent } from './cell-popover'
import { TableCellProvider } from './cell-provider'
import { TableCellReferences } from './cell-references'
import { TableCellTable } from './cell-table'
import type { Column, ColumnHandlers } from './utils'

const SetNullAlertDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const { value, onQueueValue } = useCellContext()

  const setNull = () => {
    if (!onQueueValue) {
      return
    }

    onQueueValue(null)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Set value to null?</AlertDialogTitle>
          <AlertDialogDescription>
            This will set the cell value to{' '}
            <code className="font-mono">null</code>. This action can be undone
            by editing the cell again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogCancel
            variant="warning"
            onClick={setNull}
            disabled={value === null}
          >
            Set to null
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const ForeignButton = (props: ComponentProps<'button'>) => (
  <Button variant="ghost" size="icon-xs" {...props}>
    <HugeiconsIcon
      icon={ArrowUpRight01Icon}
      strokeWidth={2}
      className="text-muted-foreground size-3"
    />
  </Button>
)

const ReferenceButton = ({
  children,
  className,
  ...props
}: ComponentProps<typeof Button>) => (
  <Button
    variant="ghost"
    size="xs"
    className={cn('px-1.5!', className)}
    {...props}
  >
    <HugeiconsIcon
      icon={ArrowDownLeft01Icon}
      strokeWidth={2}
      className="text-muted-foreground size-3"
    />
    <span className="text-muted-foreground text-xs">{children}</span>
  </Button>
)

export interface TableCellDraft {
  value: unknown
  error?: string
  isCommitting?: boolean
}

const getDraftSaveStatus = (
  draft: TableCellDraft | undefined,
  hasDraft: boolean
): SaveStatus => {
  if (draft?.error) {
    return 'error'
  }
  if (draft?.isCommitting) {
    return 'pending'
  }
  if (hasDraft) {
    return 'draft'
  }
  return 'idle'
}

const getCellClassName = ({
  isPopoverOpen,
  isForeignOpen,
  isReferencesOpen,
  status,
  column,
}: {
  isPopoverOpen: boolean
  isForeignOpen: boolean
  isReferencesOpen: boolean
  status: SaveStatus
  column: Column
}) =>
  cn(
    isPopoverOpen && 'bg-primary/8 inset-ring-primary/60',
    (isForeignOpen || isReferencesOpen) && 'bg-accent inset-ring-border',
    status === 'error' && 'bg-destructive/10 inset-ring-destructive/40',
    status === 'pending' && 'bg-primary/8 animate-pulse',
    status === 'draft' && 'bg-primary/12 inset-ring-primary/30 italic',
    (column.foreign || (column.references?.length ?? 0) > 0) && 'pr-1!'
  )

const CellForeignPopover = ({
  isOpen,
  onOpenChange,
  onActivate,
  foreign,
  value,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onActivate: () => void
  foreign: NonNullable<Column['foreign']>
  value: unknown
}) => (
  <Popover open={isOpen} onOpenChange={onOpenChange}>
    <Tooltip>
      <TooltipTrigger
        render={
          <PopoverTrigger
            render={
              <ForeignButton
                onDoubleClick={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onActivate()
                }}
              />
            }
          />
        }
      />
      <TooltipContent side="right">See foreign record</TooltipContent>
    </Tooltip>
    <PopoverContent
      className="h-[45vh] w-[80vw] overflow-hidden p-0 **:data-[slot=popover-viewport]:p-0"
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <TableCellTable
        schema={foreign.schema}
        table={foreign.table}
        column={foreign.column}
        value={value}
      />
    </PopoverContent>
  </Popover>
)

const CellReferencesPopover = ({
  isOpen,
  onOpenChange,
  onActivate,
  references,
  value,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onActivate: () => void
  references: NonNullable<Column['references']>
  value: unknown
}) => (
  <Popover open={isOpen} onOpenChange={onOpenChange}>
    <Tooltip>
      <TooltipTrigger
        render={
          <PopoverTrigger
            render={
              <ReferenceButton
                onDoubleClick={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onActivate()
                }}
              />
            }
          />
        }
      >
        {references.length}
      </TooltipTrigger>
      <TooltipContent side="right">
        See referenced records from {references.length} table
        {references.length === 1 ? '' : 's'}
      </TooltipContent>
    </Tooltip>
    <PopoverContent
      className="h-[45vh] w-[80vw] overflow-hidden p-0 **:data-[slot=popover-viewport]:p-0"
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <TableCellReferences references={references} value={value} />
    </PopoverContent>
  </Popover>
)

const InteractiveTableCell = ({
  column,
  displayValue,
  draftError,
  effectiveValue,
  onAddFilter,
  onDisableInteract,
  onOrder,
  onQueueValue,
  onRename,
  order,
  position,
  rowIndex,
  status,
  style,
  transformer,
}: {
  column: Column
  displayValue: string
  draftError?: string
  effectiveValue: unknown
  onDisableInteract: () => void
  order?: 'ASC' | 'DESC' | null
  position: TableCellProps['position']
  rowIndex: number
  status: SaveStatus
  style: TableCellProps['style']
  transformer: ReturnType<typeof createTransformer>
} & ColumnHandlers) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isForeignOpen, setIsForeignOpen] = useState(false)
  const [isReferencesOpen, setIsReferencesOpen] = useState(false)
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const [isBig, setIsBig] = useState(false)
  const [isSetNullDialogOpen, setIsSetNullDialogOpen] = useState(false)

  const cellClassName = getCellClassName({
    column,
    isForeignOpen,
    isPopoverOpen,
    isReferencesOpen,
    status,
  })

  const anyOverlayOpen =
    isPopoverOpen ||
    isForeignOpen ||
    isReferencesOpen ||
    isContextMenuOpen ||
    isSetNullDialogOpen

  const disableInteractIfPossible = async () => {
    if (!anyOverlayOpen) {
      await sleep(200)
      onDisableInteract()
    }
  }

  return (
    <TableCellProvider
      column={column}
      rowIndex={rowIndex}
      transformer={transformer}
      value={effectiveValue}
      onQueueValue={onQueueValue}
      onAddFilter={onAddFilter}
      onOrder={onOrder}
      order={order}
      onRename={onRename}
    >
      <SetNullAlertDialog
        open={isSetNullDialogOpen}
        onOpenChange={(open) => {
          setIsSetNullDialogOpen(open)
          if (!open) {
            disableInteractIfPossible()
          }
        }}
      />
      <TableCellContextMenu
        open={isContextMenuOpen}
        onOpenChange={(open) => {
          setIsContextMenuOpen(open)
          if (!open) {
            disableInteractIfPossible()
          }
        }}
        style={style}
        onSetNull={
          onQueueValue && column.isNullable
            ? () => setIsSetNullDialogOpen(true)
            : undefined
        }
      >
        <Popover
          open={isPopoverOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setIsPopoverOpen(isOpen)
              setIsBig(false)
            }
          }}
        >
          <PopoverTrigger
            nativeButton={false}
            onDoubleClick={() => setIsPopoverOpen(true)}
            onMouseLeave={disableInteractIfPossible}
            render={
              <TableCellContent
                style={style}
                value={effectiveValue}
                position={position}
                className={cellClassName}
                column={column}
                title={draftError}
              />
            }
          >
            <span className="truncate">{displayValue}</span>
            {!!effectiveValue && column.foreign && (
              <CellForeignPopover
                isOpen={isForeignOpen}
                onOpenChange={setIsForeignOpen}
                onActivate={() => {
                  setIsForeignOpen(true)
                  setIsPopoverOpen(false)
                  setIsReferencesOpen(false)
                }}
                foreign={column.foreign}
                value={effectiveValue}
              />
            )}
            {!!effectiveValue &&
              column.references &&
              column.references.length > 0 && (
                <CellReferencesPopover
                  isOpen={isReferencesOpen}
                  onOpenChange={setIsReferencesOpen}
                  onActivate={() => {
                    setIsReferencesOpen(true)
                    setIsPopoverOpen(false)
                    setIsForeignOpen(false)
                  }}
                  references={column.references}
                  value={effectiveValue}
                />
              )}
          </PopoverTrigger>
          <PopoverContent
            className={cn(
              `w-80 gap-0 overflow-auto p-0 duration-100 [transition:opacity_0.15s,transform_0.15s,width_0.3s] **:data-[slot=popover-viewport]:p-0`,
              isBig && `w-[min(50vw,60rem)]`
            )}
            onAnimationEnd={disableInteractIfPossible}
          >
            <CellPopoverContent
              isBig={isBig}
              setIsBig={setIsBig}
              onClose={() => setIsPopoverOpen(false)}
              hasUpdateFn={!!onQueueValue}
              onSetNull={() => setIsSetNullDialogOpen(true)}
            />
          </PopoverContent>
        </Popover>
      </TableCellContextMenu>
    </TableCellProvider>
  )
}

export const TableCell = ({
  value,
  rowIndex,
  column,
  style,
  position,
  size,
  onQueueValue,
  onAddFilter,
  onOrder,
  order,
  onRename,
  connectionType,
  draft,
}: {
  column: Column
  order?: 'ASC' | 'DESC' | null
  connectionType: ConnectionType
  draft?: TableCellDraft
} & TableCellProps &
  ColumnHandlers) => {
  const transformer = createTransformer(connectionType, column)
  const hasDraft = !!draft
  const effectiveValue = hasDraft ? draft.value : value
  const displayValue = transformer.toDisplay(effectiveValue, size)
  const status = getDraftSaveStatus(draft, hasDraft)
  const [canInteract, setCanInteract] = useState(false)

  const staticClassName = getCellClassName({
    column,
    isForeignOpen: false,
    isPopoverOpen: false,
    isReferencesOpen: false,
    status,
  })

  if (!canInteract) {
    return (
      <TableCellContent
        column={column}
        className={staticClassName}
        onMouseOver={() => setCanInteract(true)}
        onMouseLeave={async () => {
          await sleep(200)
          setCanInteract(false)
        }}
        style={style}
        value={effectiveValue}
        position={position}
        title={draft?.error}
      >
        <span className="truncate">{displayValue}</span>
        {!!effectiveValue && column.foreign && <ForeignButton />}
        {!!effectiveValue &&
          column.references &&
          column.references.length > 0 && (
            <ReferenceButton>{column.references.length}</ReferenceButton>
          )}
      </TableCellContent>
    )
  }

  return (
    <InteractiveTableCell
      column={column}
      displayValue={displayValue}
      draftError={draft?.error}
      effectiveValue={effectiveValue}
      onAddFilter={onAddFilter}
      onDisableInteract={() => setCanInteract(false)}
      onOrder={onOrder}
      onQueueValue={onQueueValue}
      onRename={onRename}
      order={order}
      position={position}
      rowIndex={rowIndex}
      status={status}
      style={style}
      transformer={transformer}
    />
  )
}
