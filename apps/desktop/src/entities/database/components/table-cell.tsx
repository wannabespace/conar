import type { UseMutateFunction } from '@tanstack/react-query'
import type { ComponentProps, Dispatch, SetStateAction } from 'react'
import type { Column } from '../table'
import type { CellUpdaterFunction } from './cells-updater'
import type { TableCellProps } from '~/components/table'
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

function getDisplayValue(value: unknown, oneLine: boolean) {
  if (typeof value === 'object' && value !== null)
    return oneLine ? JSON.stringify(value).replaceAll('\n', ' ') : JSON.stringify(value, null, 2)

  return oneLine ? String(value ?? '').replaceAll('\n', ' ') : String(value ?? '')
}

interface CellContextValue {
  value: string
  setValue: Dispatch<SetStateAction<string>>
  column: Column
  isJson: boolean
  initialValue: unknown
  displayValue: string
  update: UseMutateFunction<void, Error, { value: string | null, rowIndex: number }>
}

const CellContext = createContext<CellContextValue>(null!)

function useCellContext() {
  return use(CellContext)
}

function CellProvider({
  children,
  column,
  initialValue,
  onUpdate,
  onSaveError,
  onSaveSuccess,
  onSavePending,
}: {
  children: React.ReactNode
  column: Column
  initialValue: unknown
  onUpdate?: ({ rowIndex, columnId, newValue, oldValue }: { rowIndex: number, columnId: string, newValue: unknown, oldValue: unknown }) => Promise<void>
  onSaveError: (error: Error) => void
  onSaveSuccess: () => void
  onSavePending: () => void
}) {
  const isJson = !!column?.type?.includes('json')
  const displayValue = getDisplayValue(initialValue, false)
  const [value, setValue] = useState<string>(() => initialValue === null ? '' : displayValue)

  const { mutate: update } = useMutation({
    mutationFn: async ({ rowIndex, value }: { value: string | null, rowIndex: number }) => {
      if (!onUpdate)
        return

      onSavePending()

      const _value = isJson && value ? JSON.parse(value) : value

      await onUpdate({
        rowIndex,
        columnId: column.name,
        newValue: _value,
        oldValue: initialValue,
      })
    },
    onSuccess: onSaveSuccess,
    onError: onSaveError,
  })

  const context = useMemo(() => ({
    value,
    setValue,
    column,
    initialValue,
    displayValue,
    isJson,
    update,
  }), [
    value,
    setValue,
    column,
    initialValue,
    displayValue,
    isJson,
    update,
  ])

  return <CellContext.Provider value={context}>{children}</CellContext.Provider>
}

function TableCellMonaco({
  rowIndex,
  isBig,
  setIsBig,
  onClose,
  hasUpdateFn,
}: {
  rowIndex: number
  isBig: boolean
  setIsBig: Dispatch<SetStateAction<boolean>>
  onClose: () => void
  hasUpdateFn: boolean
}) {
  const { value, initialValue, column, displayValue, isJson, setValue, update } = useCellContext()

  const [isTouched, setIsTouched] = useState(false)

  const canEdit = !!column?.isEditable && hasUpdateFn
  const canSetNull = !!column?.isNullable && initialValue !== null
  const canSave = isTouched && value !== displayValue

  const setNull = () => {
    update({ value: null, rowIndex })
    onClose()
  }

  const save = (value: string) => {
    update({ value, rowIndex })
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

function CellContent({
  value,
  className,
  size,
  isFirst,
  isLast,
  ...props
}: {
  value: unknown
  className?: string
  size: number
  isFirst: boolean
  isLast: boolean
} & ComponentProps<'div'>) {
  const displayValue = useMemo(() => {
    if (value === null)
      return 'null'

    if (value === '')
      return 'empty'

    /*
      If value has a lot of symbols that don't fit in the cell,
      we truncate it to avoid performance issues.
      Used 6 as a multiplier because 1 symbol takes ~6px width
    */
    return getDisplayValue(value, true).slice(0, size / 6)
  }, [value])

  return (
    <div
      className={cn(
        'h-full text-xs truncate p-2 font-mono cursor-default select-none',
        'rounded-sm transition-ring duration-100 ring-2 ring-inset ring-transparent',
        isFirst && 'pl-4',
        isLast && 'pr-4',
        (value === null || value === '') && 'text-muted-foreground/50',
        className,
      )}
      {...props}
    >
      {displayValue}
    </div>
  )
}

function getTimestamp(value: unknown, column: Column) {
  const date = column?.type?.includes('timestamp')
    && value
    && (typeof value === 'string' || typeof value === 'number')
    ? dayjs(value)
    : null

  return date?.isValid() ? date : null
}

export function TableCell({
  value,
  rowIndex,
  column,
  className,
  columnIndex,
  isFirst,
  isLast,
  size,
  onUpdate,
  ...props
}: {
  onUpdate?: CellUpdaterFunction
  column: Column
} & TableCellProps & ComponentProps<'div'>) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isBig, setIsBig] = useState(false)
  const [canInteract, setCanInteract] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timeout = setTimeout(
        () => setStatus('idle'),
        status === 'error' ? 3000 : 1500,
      )

      return () => clearTimeout(timeout)
    }
  }, [status])

  const cellClassName = cn(
    isPopoverOpen && 'ring-primary/30 bg-primary/10',
    status === 'error' && 'ring-destructive/50 bg-destructive/20',
    status === 'success' && 'ring-success/50 bg-success/10',
    status === 'saving' && 'animate-pulse',
    className,
  )

  if (!canInteract) {
    return (
      <CellContent
        value={value}
        isFirst={isFirst}
        isLast={isLast}
        size={size}
        onMouseOver={() => setCanInteract(true)}
        className={cellClassName}
        {...props}
      />
    )
  }

  function onSaveError(error: Error) {
    setCanInteract(true)
    setIsPopoverOpen(true)
    setStatus('error')

    console.error(error)

    toast.error(`Failed to update cell "${column.name}"`, {
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

  const date = column ? getTimestamp(value, column) : null

  return (
    <CellProvider
      column={column}
      initialValue={value}
      onUpdate={onUpdate}
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
                <CellContent
                  value={value}
                  isFirst={isFirst}
                  isLast={isLast}
                  size={size}
                  className={cellClassName}
                  {...props}
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
            rowIndex={rowIndex}
            isBig={isBig}
            setIsBig={setIsBig}
            onClose={() => setIsPopoverOpen(false)}
            hasUpdateFn={!!onUpdate}
          />
        </PopoverContent>
      </Popover>
    </CellProvider>
  )
}
