import type { ActiveFilter } from '@conar/shared/filters'
import type { TableCellProps } from '@conar/table'
import type { ComponentProps } from 'react'
import type { Column } from './utils'
import { sleep } from '@conar/shared/utils/helpers'
import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowLeftDownLine, RiArrowRightUpLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { format, isValid } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'
import { TableCellContent } from './cell-content'
import { useCellContext } from './cell-context'
import { TableCellContextMenu } from './cell-menu'
import { CellPopoverContent } from './cell-popover'
import { TableCellProvider } from './cell-provider'
import { TableCellReferences } from './cell-references'
import { TableCellTable } from './cell-table'
import { getDisplayValue } from './utils'

function SetNullAlertDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { value, onUpdate } = useCellContext()

  const setNull = () => {
    onUpdate(null)
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

function getTimestamp(value: unknown, column: Column) {
  const date = (
    column?.type?.includes('timestamp')
    || column?.type?.includes('datetime')
  )
  && value
  && (typeof value === 'string' || typeof value === 'number')
    ? new Date(value)
    : null

  return date && isValid(date) ? date : null
}

export function TableCell({
  value,
  rowIndex,
  column,
  style,
  position,
  size,
  onSaveValue,
  availableValues,
  onAddFilter,
  onSort,
  sortOrder,
  onRenameColumn,
}: {
  onSaveValue?: (rowIndex: number, columnName: string, value: unknown) => Promise<void>
  column: Column
  availableValues?: string[]
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onRenameColumn?: () => void
} & TableCellProps) {
  const displayValue = getDisplayValue({ value, size })
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isForeignOpen, setIsForeignOpen] = useState(false)
  const [isReferencesOpen, setIsReferencesOpen] = useState(false)
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const [isBig, setIsBig] = useState(false)
  const [isSetNullDialogOpen, setIsSetNullDialogOpen] = useState(false)
  const [canInteract, setCanInteract] = useState(false)

  const { mutate: update, status } = useMutation({
    mutationFn: async (value: string | null) => {
      if (!onSaveValue)
        return

      await onSaveValue(
        rowIndex,
        column.id,
        value,
      )
    },
    onError: (error) => {
      console.error(error)

      toast.error(`Failed to update cell "${column.id}"`, {
        id: `save-cell-error-${column.id}-${error.message}`,
        description: error.message,
        duration: 3000,
      })
    },
  })

  function disableInteractIfPossible() {
    if (!isPopoverOpen && !isForeignOpen && !isReferencesOpen && !isContextMenuOpen && !isSetNullDialogOpen) {
      sleep(200).then(() => setCanInteract(false))
    }
  }

  if (!canInteract) {
    return (
      <TableCellContent
        isPopoverOpen={isPopoverOpen}
        isForeignOpen={isForeignOpen}
        isReferencesOpen={isReferencesOpen}
        status={status}
        column={column}
        onMouseOver={() => setCanInteract(true)}
        onMouseLeave={disableInteractIfPossible}
        style={style}
        value={value}
        position={position}
      >
        <span className="truncate">{displayValue}</span>
        {!!value && column.foreign && <ForeignButton />}
        {!!value && column.references && column.references.length > 0 && <ReferenceButton>{column.references.length}</ReferenceButton>}
      </TableCellContent>
    )
  }

  const date = column ? getTimestamp(value, column) : null

  return (
    <TableCellProvider
      column={column}
      rowIndex={rowIndex}
      value={value}
      availableValues={availableValues}
      onUpdate={update}
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
        onSetNull={onSaveValue && column.isNullable
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
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger
                nativeButton={false}
                onDoubleClick={() => setIsPopoverOpen(true)}
                onMouseLeave={disableInteractIfPossible}
                render={(
                  <TableCellContent
                    style={style}
                    value={value}
                    position={position}
                    isPopoverOpen={isPopoverOpen}
                    isForeignOpen={isForeignOpen}
                    isReferencesOpen={isReferencesOpen}
                    status={status}
                    column={column}
                  />
                )}
              >
                <span className="truncate">{displayValue}</span>
                {!!value && column.foreign && (
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
                        value={value}
                      />
                    </PopoverContent>
                  </Popover>
                )}
                {!!value && column.references && column.references.length > 0 && (
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
                        value={value}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </PopoverTrigger>
            </TooltipTrigger>
            {date && (
              <TooltipContent side="left">
                {format(date, 'dd MMMM yyyy, HH:mm:ss (z)')}
              </TooltipContent>
            )}
          </Tooltip>
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
              hasUpdateFn={!!onSaveValue}
              onSetNull={() => setIsSetNullDialogOpen(true)}
            />
          </PopoverContent>
        </Popover>
      </TableCellContextMenu>
    </TableCellProvider>
  )
}
