import type { Cell } from '@tanstack/react-table'
import type { editor } from 'monaco-editor'
import type { ComponentRef, RefObject } from 'react'
import { Button } from '@connnect/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@connnect/ui/components/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { copy } from '@connnect/ui/lib/copy'
import { cn } from '@connnect/ui/lib/utils'
import { RiCollapseDiagonal2Line, RiExpandDiagonal2Line, RiFileCopyLine } from '@remixicon/react'
import {
  flexRender,
} from '@tanstack/react-table'
import { useEffect, useRef, useState } from 'react'
import { Monaco } from '~/components/monaco'

export interface TableColumn {
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

function TableCellContent({ ref, value, meta }: { ref: RefObject<{ setIsBig: (isBig: boolean) => void } | null>, value: unknown, meta: TableColumn }) {
  const [isBig, setIsBig] = useState(false)
  const isJson = !!meta.type?.includes('json')
  const displayValue = isJson ? JSON.stringify(value, null, 2) : getDisplayValue(value)
  const [currentValue, setCurrentValue] = useState(value === null ? '' : displayValue)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)

  useEffect(() => {
    ref.current = {
      setIsBig,
    }
  }, [isBig])

  return (
    <PopoverContent className={cn('p-0 w-80 overflow-auto [transition:opacity_0.15s,transform_0.15s,width_0.3s]', isBig && 'w-[min(50vw,60rem)]')}>
      <Monaco
        ref={monacoRef}
        value={currentValue}
        language={meta.type?.includes('json') ? 'json' : undefined}
        className={cn('w-full h-40 transition-[height] duration-300', isBig && 'h-[min(40vh,30rem)]')}
        onChange={setCurrentValue}
        options={{
          lineNumbers: 'off',
          readOnly: true,
          // readOnly: !meta.isEditable,
          scrollBeyondLastLine: false,
          folding: false,
        }}
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
        {/* <div className="flex gap-2">
            {meta.isEditable && (
              <>
                {currentValue !== displayValue && (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={resetValue}
                  >
                    Reset
                  </Button>
                )}
                {meta.isNullable && currentValue !== 'null' && (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={setNull}
                  >
                    Set
                    {' '}
                    <span className="font-mono">null</span>
                  </Button>
                )}
                <Button
                  size="xs"
                  disabled={currentValue === displayValue}
                  onClick={save}
                >
                  Save
                </Button>
              </>
            )}
          </div> */}
      </div>
    </PopoverContent>
  )
}

export function TableCell<T extends Record<string, unknown>>({ cell }: { cell: Cell<T, unknown> }) {
  const [open, setOpen] = useState(false)
  const cellValue = cell.getValue()
  const ref = useRef<ComponentRef<typeof TableCellContent>>(null)

  const meta = cell.column.columnDef.meta as TableColumn

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)

        if (!isOpen)
          ref.current?.setIsBig(false)
      }}
    >
      <PopoverTrigger asChild>
        <div
          key={cell.id}
          data-mask
          className={cn(
            'flex items-center h-full shrink-0 text-xs truncate p-2 group-first:pl-4 group-last:pr-4 font-mono cursor-default select-none',
            open && 'bg-muted/50 ring-2 ring-inset ring-primary/50',
            cellValue === null && 'text-muted-foreground',
          )}
          style={{
            width: `${cell.column.getSize()}px`,
          }}
          onDoubleClick={() => setOpen(true)}
          onClick={(e) => {
            e.preventDefault()
          }}
        >
          {flexRender(
            cell.column.columnDef.cell,
            cell.getContext(),
          )}
        </div>
      </PopoverTrigger>
      <TableCellContent
        ref={ref}
        value={cellValue}
        meta={meta}
      />
    </Popover>
  )
}
