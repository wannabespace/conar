import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ActiveFilter } from '@conar/shared/filters'
import type { TableCellProps } from '@conar/table'
import type { ComponentProps } from 'react'
import type { SaveStatus } from './cell-context'
import type { Column } from './utils'
import { sleep } from '@conar/shared/utils/helpers'
import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowLeftDownLine, RiArrowRightUpLine } from '@remixicon/react'
import { useState } from 'react'
import { createTransformer } from '~/entities/connection/transformers'
import { TableCellContent } from './cell-content'
import { useCellContext } from './cell-context'
import { TableCellContextMenu } from './cell-menu'
import { CellPopoverContent } from './cell-popover'
import { TableCellProvider } from './cell-provider'
import { TableCellReferences } from './cell-references'
import { TableCellTable } from './cell-table'

function SetNullAlertDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { value, onQueueValue } = useCellContext()

  const setNull = async () => {
    if (!onQueueValue)
      return

    onQueueValue(null)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Set value to null?</AlertDialogTitle>
          <AlertDialogDescription>
            This will set the cell value to
            {' '}
            <code className="font-mono">null</code>
            .
            This action can be undone by editing the cell again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <AlertDialogClose render={<Button variant="warning" />} onClick={setNull} disabled={value === null}>Set to null</AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ForeignButton(props: ComponentProps<'button'>) {
  return (
    <Button
      variant="outline"
      size="icon-xs"
      {...props}
    >
      <RiArrowRightUpLine className="size-3 text-muted-foreground" />
    </Button>
  )
}

function ReferenceButton({ children, className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      size="xs"
      className={cn('px-1.5!', className)}
      {...props}
    >
      <RiArrowLeftDownLine className="size-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        {children}
      </span>
    </Button>
  )
}

export interface TableCellDraft {
  value: unknown
  error?: string
  isCommitting?: boolean
}

export function TableCell({
  value,
  rowIndex,
  column,
  style,
  position,
  size,
  onQueueValue,
  onAddFilter,
  onSort,
  sortOrder,
  onRenameColumn,
  connectionType,
  draft,
}: {
  onQueueValue?: (rowIndex: number, columnName: string, value: unknown) => unknown
  column: Column
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onRenameColumn?: () => void
  connectionType: ConnectionType
  draft?: TableCellDraft
} & TableCellProps) {
  const transformer = createTransformer(connectionType, column)
  const hasDraft = !!draft
  const effectiveValue = hasDraft ? draft.value : value
  const displayValue = transformer.toDisplay(effectiveValue, size)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isForeignOpen, setIsForeignOpen] = useState(false)
  const [isReferencesOpen, setIsReferencesOpen] = useState(false)
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const [isBig, setIsBig] = useState(false)
  const [isSetNullDialogOpen, setIsSetNullDialogOpen] = useState(false)
  const [canInteract, setCanInteract] = useState(false)

  const status: SaveStatus = draft?.error
    ? 'error'
    : draft?.isCommitting
      ? 'pending'
      : hasDraft
        ? 'draft'
        : 'idle'

  const cellClassName = cn(
    isPopoverOpen && 'bg-primary/10 ring-primary/30',
    (isForeignOpen || isReferencesOpen) && 'bg-accent/30 ring-accent/60',
    status === 'error' && 'bg-destructive/15 ring-destructive/50',
    status === 'pending' && 'animate-pulse bg-primary/10',
    status === 'draft' && 'bg-warning/15 ring-warning/50',
    (column.foreign || (column.references?.length ?? 0) > 0) && 'pr-1!',
  )

  function disableInteractIfPossible() {
    if (!isPopoverOpen && !isForeignOpen && !isReferencesOpen && !isContextMenuOpen && !isSetNullDialogOpen) {
      sleep(200).then(() => setCanInteract(false))
    }
  }

  if (!canInteract) {
    return (
      <TableCellContent
        column={column}
        className={cellClassName}
        onMouseOver={() => setCanInteract(true)}
        onMouseLeave={disableInteractIfPossible}
        style={style}
        value={effectiveValue}
        position={position}
        title={draft?.error}
      >
        <span className="truncate">{displayValue}</span>
        {!!effectiveValue && column.foreign && <ForeignButton />}
        {!!effectiveValue && column.references && column.references.length > 0 && <ReferenceButton>{column.references.length}</ReferenceButton>}
      </TableCellContent>
    )
  }

  return (
    <TableCellProvider
      column={column}
      rowIndex={rowIndex}
      transformer={transformer}
      value={effectiveValue}
      onQueueValue={onQueueValue}
      onAddFilter={onAddFilter}
      onSort={onSort}
      sortOrder={sortOrder}
      onRenameColumn={onRenameColumn}
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
        onSetNull={onQueueValue && column.isNullable
          ? () => setIsSetNullDialogOpen(true)
          : undefined}
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
            render={(
              <TableCellContent
                style={style}
                value={effectiveValue}
                position={position}
                className={cellClassName}
                column={column}
                title={draft?.error}
              />
            )}
          >
            <span className="truncate">{displayValue}</span>
            {!!effectiveValue && column.foreign && (
              <Popover
                open={isForeignOpen}
                onOpenChange={setIsForeignOpen}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger render={(
                      <ForeignButton
                        onDoubleClick={e => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()

                          setIsForeignOpen(true)
                          setIsPopoverOpen(false)
                          setIsReferencesOpen(false)
                        }}
                      />
                    )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    See foreign record
                  </TooltipContent>
                </Tooltip>
                <PopoverContent
                  className="
                    h-[45vh] w-[80vw] overflow-hidden p-0
                    **:data-[slot=popover-viewport]:p-0
                  "
                  onDoubleClick={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  <TableCellTable
                    schema={column.foreign.schema}
                    table={column.foreign.table}
                    column={column.foreign.column}
                    value={effectiveValue}
                  />
                </PopoverContent>
              </Popover>
            )}
            {!!effectiveValue && column.references && column.references.length > 0 && (
              <Popover
                open={isReferencesOpen}
                onOpenChange={setIsReferencesOpen}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger
                      render={(
                        <ReferenceButton
                          onDoubleClick={e => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()

                            setIsReferencesOpen(true)
                            setIsPopoverOpen(false)
                            setIsForeignOpen(false)
                          }}
                        />
                      )}
                    >
                      {column.references.length}
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    See referenced records from
                    {' '}
                    {column.references.length}
                    {' '}
                    table
                    {column.references.length === 1 ? '' : 's'}
                  </TooltipContent>
                </Tooltip>
                <PopoverContent
                  className="
                    h-[45vh] w-[80vw] overflow-hidden p-0
                    **:data-[slot=popover-viewport]:p-0
                  "
                  onDoubleClick={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  <TableCellReferences
                    references={column.references}
                    value={effectiveValue}
                  />
                </PopoverContent>
              </Popover>
            )}
          </PopoverTrigger>
          <PopoverContent
            className={cn(`
              w-80 overflow-auto p-0 duration-100
              [transition:opacity_0.15s,transform_0.15s,width_0.3s]
              **:data-[slot=popover-viewport]:p-0
            `, isBig && `w-[min(50vw,60rem)]`)}
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
