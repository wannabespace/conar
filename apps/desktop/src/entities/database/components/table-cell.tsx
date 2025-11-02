import type { editor } from 'monaco-editor'
import type { ComponentProps, Dispatch, SetStateAction } from 'react'
import type { Column } from '../utils/table'
import type { TableCellProps } from '~/components/table'
import { sleep } from '@conar/shared/utils/helpers'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { CtrlEnter } from '@conar/ui/components/custom/shortcuts'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowLeftDownLine, RiArrowRightUpLine, RiCollapseDiagonal2Line, RiExpandDiagonal2Line, RiFileCopyLine } from '@remixicon/react'
import dayjs from 'dayjs'
import { KeyCode, KeyMod } from 'monaco-editor'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CellSwitch } from '~/components/cell-switch'
import { Monaco } from '~/components/monaco'
import { getDisplayValue } from '../lib/render'
import { TableCellContent } from './table-cell-content'
import { TableCellProvider, useCellContext } from './table-cell-provider'
import { TableCellReferences } from './table-cell-references'
import { TableCellTable } from './table-cell-table'

function CellPopoverContent({
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
  const { value, initialValue, column, displayValue, setValue, update } = useCellContext()
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)

  const save = (value: string) => {
    update({ value, rowIndex })
    onClose()
  }

  const saveEvent = useEffectEvent(save)

  useEffect(() => {
    if (!monacoRef.current)
      return

    monacoRef.current.addAction({
      id: 'conar.execute-on-enter',
      label: 'Execute on Enter',
      keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
      run: (e) => {
        saveEvent(e.getValue() ?? '')
      },
    })
  }, [monacoRef])

  const canEdit = !!column?.isEditable && hasUpdateFn
  const canSetNull = !!column?.isNullable && initialValue !== null
  const canSave = value !== displayValue

  const setNull = () => {
    update({ value: null, rowIndex })
    onClose()
  }

  const shouldHideToggleSize = column.type === 'boolean'
    || column.type?.includes('time')
    || column.type?.includes('numeric')

  const monacoOptions = {
    lineNumbers: isBig ? 'on' as const : 'off' as const,
    readOnly: !canEdit,
    scrollBeyondLastLine: false,
    folding: isBig,
    scrollbar: {
      horizontalScrollbarSize: 5,
      verticalScrollbarSize: 5,
    },
  }

  return (
    <>
      {column?.type === 'boolean'
        ? (
            <CellSwitch
              className="py-6 w-full justify-center"
              checked={value === 'true'}
              onChange={checked => setValue(checked.toString())}
              onSave={save}
            />
          )
        : (
            <Monaco
              ref={monacoRef}
              data-mask
              value={value}
              language={column?.type?.includes('json') ? 'json' : undefined}
              className={cn('w-full h-40 transition-[height] duration-300', isBig && 'h-[min(45vh,40rem)]')}
              onChange={setValue}
              options={monacoOptions}
            />
          )}
      <div className="flex justify-between items-center gap-2 p-2 border-t">
        <div className="flex items-center gap-2">
          {!shouldHideToggleSize && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => setIsBig(prev => !prev)}
                  >
                    {isBig ? <RiCollapseDiagonal2Line className="size-3" /> : <RiExpandDiagonal2Line className="size-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Toggle size</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon-xs" variant="outline" onClick={() => copy(value, 'Value copied to clipboard')}>
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
                <CtrlEnter userAgent={navigator.userAgent} />
              </Button>
            </>
          )}
        </div>
      </div>
    </>
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

function ReferenceButton({ count, className, ...props }: ComponentProps<'button'> & { count: number }) {
  return (
    <Button
      variant="outline"
      size="xs"
      className={cn('px-1.5!', className)}
      {...props}
    >
      <RiArrowLeftDownLine className="size-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        {count}
      </span>
    </Button>
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
  style,
  position,
  size,
  onSaveValue,
}: {
  onSaveValue?: (rowIndex: number, columnName: string, value: unknown) => Promise<void>
  column: Column
} & TableCellProps) {
  const displayValue = getDisplayValue(value, size)

  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isForeignOpen, setIsForeignOpen] = useState(false)
  const [isReferencesOpen, setIsReferencesOpen] = useState(false)
  const [isBig, setIsBig] = useState(false)
  const [canInteract, setCanInteract] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'pending'>('idle')

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timeout = setTimeout(
        () => setStatus('idle'),
        status === 'error' ? 3000 : 1000,
      )

      return () => clearTimeout(timeout)
    }
  }, [status])

  const cellClassName = cn(
    'ring-1 flex justify-between',
    isPopoverOpen && 'ring-primary/30 bg-primary/10',
    (isForeignOpen || isReferencesOpen) && 'ring-accent/60 bg-accent/30',
    status === 'error' && 'ring-destructive/50 bg-destructive/20',
    status === 'success' && 'ring-success/50 bg-success/10',
    status === 'pending' && 'animate-pulse bg-primary/10',
    position === 'first' && 'pl-4',
    position === 'last' && 'pr-4',
    (column.foreign || (column.references?.length ?? 0) > 0) && 'pr-1',
    className,
  )

  function disableInteractIfPossible() {
    if (!isPopoverOpen && !isForeignOpen && !isReferencesOpen) {
      sleep(200).then(() => setCanInteract(false))
    }
  }

  if (!canInteract) {
    return (
      <TableCellContent
        onMouseOver={() => setCanInteract(true)}
        onMouseLeave={disableInteractIfPossible}
        className={cellClassName}
        style={style}
        value={value}
      >
        <span className="truncate">{displayValue}</span>
        {!!value && column.foreign && <ForeignButton />}
        {!!value && column.references && column.references.length > 0 && <ReferenceButton count={column.references.length} />}
      </TableCellContent>
    )
  }

  function onSaveError(error: Error) {
    setCanInteract(true)
    setIsPopoverOpen(true)
    setStatus('error')

    console.error(error)

    const description = String(error.cause || error.message)

    toast.error(`Failed to update cell "${column.id}"`, {
      description: description.startsWith('Error: ') ? description.slice(7) : description,
      duration: 3000,
    })
  }

  const date = column ? getTimestamp(value, column) : null

  return (
    <TableCellProvider
      column={column}
      initialValue={value}
      displayValue={displayValue}
      onSaveValue={onSaveValue}
      onSavePending={() => setStatus('pending')}
      onSaveSuccess={() => setStatus('success')}
      onSaveError={onSaveError}
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
                onMouseLeave={disableInteractIfPossible}
              >
                <TableCellContent
                  className={cellClassName}
                  style={style}
                  value={value}
                >
                  <span className="truncate">{displayValue}</span>
                  {!!value && column.foreign && (
                    <Popover
                      open={isForeignOpen}
                      onOpenChange={setIsForeignOpen}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <ForeignButton
                                onDoubleClick={e => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()

                                  setIsForeignOpen(true)
                                  setIsPopoverOpen(false)
                                  setIsReferencesOpen(false)
                                }}
                              />
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm">
                            See foreign record
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <PopoverContent
                        className="w-[80vw] h-[45vh] p-0 overflow-hidden"
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <ReferenceButton
                                count={column.references.length}
                                onDoubleClick={e => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()

                                  setIsReferencesOpen(true)
                                  setIsPopoverOpen(false)
                                  setIsForeignOpen(false)
                                }}
                              />
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm">
                            See referenced records from
                            {' '}
                            {column.references.length}
                            {' '}
                            table
                            {column.references.length === 1 ? '' : 's'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <PopoverContent
                        className="w-[80vw] h-[45vh] p-0 overflow-hidden"
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
                </TableCellContent>
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
          onAnimationEnd={disableInteractIfPossible}
        >
          <CellPopoverContent
            rowIndex={rowIndex}
            isBig={isBig}
            setIsBig={setIsBig}
            onClose={() => setIsPopoverOpen(false)}
            hasUpdateFn={!!onSaveValue}
          />
        </PopoverContent>
      </Popover>
    </TableCellProvider>
  )
}
