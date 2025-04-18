import type { UseMutateFunction } from '@tanstack/react-query'
import type { Cell, CellContext, Table } from '@tanstack/react-table'
import type { ComponentProps, Dispatch, SetStateAction } from 'react'
import type { TableMeta } from './table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@connnect/ui/components/alert-dialog'
import { Button } from '@connnect/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@connnect/ui/components/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { copy } from '@connnect/ui/lib/copy'
import { cn } from '@connnect/ui/lib/utils'
import { RiCollapseDiagonal2Line, RiExpandDiagonal2Line, RiFileCopyLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { type } from 'arktype'
import dayjs from 'dayjs'
import { createContext, use, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { sleep } from '~/lib/helpers'

export interface TableCellMeta {
  name: string
  type?: string
  isEditable?: boolean
  isNullable?: boolean
  isEnum?: boolean
  isPrimaryKey?: boolean
}

function getDisplayValue(value: unknown) {
  if (value instanceof Date)
    return value.toISOString()

  if (typeof value === 'object')
    return JSON.stringify(value)

  return String(value ?? '')
}

const TableCellContext = createContext<{
  value: string
  setValue: Dispatch<SetStateAction<string>>
  cell: Cell<Record<string, unknown>, unknown>
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
  cell: Cell<Record<string, unknown>, unknown>
  table: Table<Record<string, unknown>>
  children: React.ReactNode
  onSaveError: (error: Error) => void
  onSaveSuccess: () => void
  onSavePending: () => void
}) {
  const initialValue = cell.getValue()
  const isJson = !!(cell.column.columnDef.meta as TableCellMeta).type?.includes('json')
  const displayValue = isJson && initialValue ? JSON.stringify(initialValue, null, 2) : getDisplayValue(initialValue)
  const [value, setValue] = useState<string>(initialValue === null ? '' : displayValue)

  useEffect(() => {
    setValue(initialValue === null ? '' : displayValue)
  }, [initialValue])

  const { mutate: updateCell } = useMutation({
    mutationFn: async (value: string | null) => {
      onSavePending()

      const _value = isJson && value ? JSON.parse(value) : value

      await (table.options.meta as TableMeta).updateCell?.(
        cell.row.index,
        cell.column.getIndex(),
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
  const cellMeta = cell.column.columnDef.meta as TableCellMeta

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
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function getTimestamp(value: unknown, meta: TableCellMeta) {
  const numberType = type('string.numeric | number | Date | null')
  const isTimestamp = (meta as TableCellMeta)?.type?.includes('timestamp')
    || [
      'created_at',
      'updated_at',
      'deleted_at',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ].some(keyword => meta.name?.toLowerCase().includes(keyword))
  const timestamp = numberType(value)
  const date = isTimestamp
    && timestamp
    && !(timestamp instanceof type.errors)
    && !Number.isNaN(Number(timestamp))
    ? dayjs(Number(timestamp))
    : null

  return date
}

export function TableCell({ cell, getValue, table }: CellContext<Record<string, unknown>, unknown>) {
  const [isOpen, setIsOpen] = useState(false)
  const cellValue = getValue()
  const [canInteract, setCanInteract] = useState(false)
  const [isBig, setIsBig] = useState(false)
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
    setIsOpen(true)
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
    isOpen && 'ring-primary/50 bg-muted/50',
    status === 'error' && 'ring-destructive/50 bg-destructive/20',
    status === 'success' && 'ring-success/50 bg-success/10',
    status === 'saving' && 'animate-pulse',
  )

  if (!canInteract) {
    return (
      <TableCellContent
        value={cellValue}
        onMouseOver={() => setCanInteract(true)}
        className={className}
      />
    )
  }

  const date = getTimestamp(cellValue, cell.column.columnDef.meta as TableCellMeta)

  return (
    <TableCellProvider
      cell={cell}
      table={table}
      onSavePending={onSavePending}
      onSaveError={onSaveError}
      onSaveSuccess={onSaveSuccess}
    >
      <Popover
        open={isOpen}
        onOpenChange={(isOpen) => {
          setIsOpen(isOpen)

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
                onDoubleClick={() => setIsOpen(true)}
                onMouseLeave={() => !isOpen && sleep(100).then(() => setCanInteract(false))}
              >
                <TableCellContent
                  value={cellValue}
                  className={className}
                />
              </PopoverTrigger>
            </TooltipTrigger>
            {date && date.isValid() && (
              <TooltipContent>
                {date.format('DD MMMM YYYY, HH:mm:ss (Z)')}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <PopoverContent
          className={cn('p-0 w-80 overflow-auto duration-100 [transition:opacity_0.15s,transform_0.15s,width_0.3s]', isBig && 'w-[min(50vw,60rem)]')}
          onAnimationEnd={() => !isOpen && setCanInteract(false)}
        >
          <TableCellMonaco
            isBig={isBig}
            setIsBig={setIsBig}
            onClose={() => setIsOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </TableCellProvider>
  )
}

function TableCellContent({
  value,
  className,
  ...props
}: {
  value: unknown
  className?: string
} & ComponentProps<'div'>) {
  const displayValue = (() => {
    if (value === null)
      return 'null'

    if (value === '')
      return 'empty'

    return getDisplayValue(value)
  })()

  return (
    <div
      data-mask
      className={cn(
        'h-full text-xs truncate p-2 group-first/cell:pl-4 group-last/cell:pr-4 font-mono cursor-default select-none',
        'transition-all duration-100',
        'ring-2 ring-inset ring-transparent',
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
