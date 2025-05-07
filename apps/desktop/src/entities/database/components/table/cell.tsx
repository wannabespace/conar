import type { UseMutateFunction } from '@tanstack/react-query'
import type { CellContext, Table, Cell as TableCell } from '@tanstack/react-table'
import type { ComponentProps, Dispatch, SetStateAction } from 'react'
import type { TableMeta } from './table'
import { getOS } from '@connnect/shared/utils/os'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@connnect/ui/components/alert-dialog'
import { Button } from '@connnect/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@connnect/ui/components/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { copy } from '@connnect/ui/lib/copy'
import { cn } from '@connnect/ui/lib/utils'
import { RiCollapseDiagonal2Line, RiCommandLine, RiCornerDownLeftLine, RiExpandDiagonal2Line, RiFileCopyLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { createContext, use, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { sleep } from '~/lib/helpers'

const os = getOS()

export interface CellMeta {
  name: string
  type?: string
  isEditable?: boolean
  isNullable?: boolean
  isPrimaryKey?: boolean
}

function getDisplayValue(value: unknown, pretty = true) {
  if (typeof value === 'object')
    return pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value)

  return String(value ?? '')
}

const TableCellContext = createContext<{
  value: string
  setValue: Dispatch<SetStateAction<string>>
  cell: TableCell<Record<string, unknown>, unknown>
  table: Table<Record<string, unknown>>
  isJson: boolean
  initialValue: unknown
  displayValue: string
  updateCell: UseMutateFunction<void, Error, string | null>
}>(null!)

function TableCellProvider({
  cell,
  table,
  onSaveError,
  onSaveSuccess,
  onSavePending,
  children,
}: {
  cell: TableCell<Record<string, unknown>, unknown>
  table: Table<Record<string, unknown>>
  children: React.ReactNode
  onSaveError: (error: Error) => void
  onSaveSuccess: () => void
  onSavePending: () => void
}) {
  const initialValue = cell.getValue()
  const isJson = !!(cell.column.columnDef.meta as CellMeta).type?.includes('json')
  const displayValue = getDisplayValue(initialValue)
  const [value, setValue] = useState<string>(initialValue === null ? '' : displayValue)

  const { mutate: updateCell } = useMutation({
    mutationFn: async (value: string | null) => {
      onSavePending()

      const _value = isJson && value ? JSON.parse(value) : value

      await (table.options.meta as TableMeta).updateCell?.(
        cell.row.index,
        (cell.column.columnDef.meta as CellMeta).name,
        _value,
      )
    },
    onSuccess: onSaveSuccess,
    onError: onSaveError,
  })

  const context = useMemo(() => ({
    value,
    setValue,
    cell,
    table,
    initialValue,
    displayValue,
    isJson,
    updateCell,
  }), [
    value,
    setValue,
    cell,
    table,
    initialValue,
    displayValue,
    isJson,
    updateCell,
  ])

  return <TableCellContext value={context}>{children}</TableCellContext>
}

function TableCellMonaco({
  isBig,
  setIsBig,
  onClose,
}: {
  isBig: boolean
  setIsBig: Dispatch<SetStateAction<boolean>>
  onClose: () => void
}) {
  const { value, setValue, cell, table, initialValue, displayValue, isJson, updateCell } = use(TableCellContext)

  const tableMeta = table.options.meta as TableMeta
  const cellMeta = cell.column.columnDef.meta as CellMeta

  const [isTouched, setIsTouched] = useState(false)

  const canEdit = !!cellMeta.isEditable && !!tableMeta.updateCell
  const canSetNull = !!cellMeta.isNullable && initialValue !== null
  const canSave = isTouched && value !== displayValue

  const setNull = () => {
    updateCell(null)
    onClose()
  }

  const save = (value: string) => {
    updateCell(value)
    onClose()
  }

  return (
    <>
      <Monaco
        value={value}
        language={isJson ? 'json' : undefined}
        className={cn('w-full h-40 transition-[height] duration-300', isBig && 'h-[min(40vh,30rem)]')}
        onChange={(value) => {
          setValue(value)

          if (!isTouched)
            setIsTouched(true)
        }}
        options={{
          lineNumbers: isBig ? 'on' : 'off',
          readOnly: !canEdit,
          scrollBeyondLastLine: false,
          folding: isBig,
          scrollbar: {
            horizontalScrollbarSize: 5,
            verticalScrollbarSize: 5,
          },
        }}
        onEnter={save}
      />
      <div className="flex justify-between items-center gap-2 p-2 border-t">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="iconXs"
                  onClick={() => setIsBig(prev => !prev)}
                >
                  {isBig ? <RiCollapseDiagonal2Line className="size-3" /> : <RiExpandDiagonal2Line className="size-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Toggle size</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="iconXs" variant="outline" onClick={() => copy(displayValue)}>
                  <RiFileCopyLine className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Copy value</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <>
              {canSetNull && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="xs"
                      variant="secondary"
                    >
                      Set
                      {' '}
                      <span className="font-mono">null</span>
                    </Button>
                  </AlertDialogTrigger>
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
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => setNull()}>Set to null</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                size="xs"
                disabled={!canSave}
                onClick={() => save(value)}
              >
                Save
                <kbd className="flex items-center text-xs">
                  {os === 'macos' ? <RiCommandLine className="size-2.5" /> : 'Ctrl'}
                  <RiCornerDownLeftLine className="size-2.5" />
                </kbd>
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function getTimestamp(value: unknown, meta: CellMeta) {
  const date = meta?.type?.includes('timestamp')
    && value
    && (typeof value === 'string' || typeof value === 'number')
    ? dayjs(value)
    : null

  return date?.isValid() ? date : null
}

function TableCellContent({
  cell,
  className,
  ...props
}: {
  cell: TableCell<Record<string, unknown>, unknown>
  className?: string
} & ComponentProps<'div'>) {
  const value = cell.getValue()

  const displayValue = useMemo(() => {
    if (value === null)
      return 'null'

    if (value === '')
      return 'empty'

    return getDisplayValue(value, false)
  }, [value, cell])

  return (
    <div
      data-mask
      className={cn(
        'h-full text-xs truncate p-2 group-first/cell:pl-4 group-last/cell:pr-4 font-mono cursor-default select-none',
        'rounded-sm transition-ring duration-100 ring-2 ring-inset ring-transparent',
        value === null && 'text-muted-foreground/50',
        value === '' && 'text-muted-foreground/50',
        className,
      )}
      {...props}
    >
      {displayValue}
    </div>
  )
}

export function Cell({ cell, table }: CellContext<Record<string, unknown>, unknown>) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isBig, setIsBig] = useState(false)
  const [canInteract, setCanInteract] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timeout = setTimeout(
        () => setStatus('idle'),
        status === 'error' ? 3000 : 1000,
      )

      return () => clearTimeout(timeout)
    }
  }, [status])

  function onSaveError(error: Error) {
    setCanInteract(true)
    setIsPopoverOpen(true)
    setStatus('error')

    toast.error(`Failed to update cell ${cell.column.id}`, {
      description: error.message,
      duration: 3000,
    })
  }

  function onSaveSuccess() {
    setStatus('success')
  }

  function onSavePending() {
    setStatus('saving')
  }

  const className = cn(
    isPopoverOpen && 'ring-primary/30 bg-primary/10',
    status === 'error' && 'ring-destructive/50 bg-destructive/20',
    status === 'success' && 'ring-success/50 bg-success/10',
    status === 'saving' && 'animate-pulse',
  )

  if (!canInteract) {
    return (
      <TableCellContent
        cell={cell}
        onMouseOver={() => setCanInteract(true)}
        className={className}
      />
    )
  }

  const cellMeta = cell.column.columnDef.meta as CellMeta
  const date = getTimestamp(cell.getValue(), cellMeta)

  return (
    <TableCellProvider
      cell={cell}
      table={table}
      onSavePending={onSavePending}
      onSaveError={onSaveError}
      onSaveSuccess={onSaveSuccess}
    >
      <Popover
        open={isPopoverOpen}
        onOpenChange={(isOpen) => {
          setIsPopoverOpen(isOpen)

          if (!isOpen) {
            setIsBig(false)
          }
        }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger
                asChild
                onClick={e => e.preventDefault()}
                onDoubleClick={() => setIsPopoverOpen(true)}
                onMouseLeave={() => !isPopoverOpen && sleep(100).then(() => setCanInteract(false))}
              >
                <TableCellContent
                  cell={cell}
                  className={className}
                />
              </PopoverTrigger>
            </TooltipTrigger>
            {date && (
              <TooltipContent>
                {date.format('DD MMMM YYYY, HH:mm:ss (Z)')}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <PopoverContent
          className={cn('p-0 w-80 overflow-auto duration-100 [transition:opacity_0.15s,transform_0.15s,width_0.3s]', isBig && 'w-[min(50vw,60rem)]')}
          onAnimationEnd={() => !isPopoverOpen && setCanInteract(false)}
        >
          <TableCellMonaco
            isBig={isBig}
            setIsBig={setIsBig}
            onClose={() => setIsPopoverOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </TableCellProvider>
  )
}
