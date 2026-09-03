import {
  ArrowExpandDiagonal02Icon,
  ArrowShrinkIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@tamery/ui/components/combobox'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { KbdCtrlEnter } from '@tamery/ui/components/custom/shortcuts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import type { editor } from 'monaco-editor'
import { KeyCode, KeyMod } from 'monaco-editor'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { StickToBottomInstance } from 'use-stick-to-bottom'
import { useStickToBottom } from 'use-stick-to-bottom'

import { CellSwitch } from '~/components/cell-switch'
import { Monaco } from '~/components/monaco'

import { useCellContext } from './cell-context'
import { estimateCompactHeight } from './utils'

// Monaco keybindings are bit flags; bitwise OR is required by the API.
// oxlint-disable-next-line no-bitwise
const monacoEnterKeybinding = KeyMod.CtrlCmd | KeyCode.Enter

const monacoLanguageForColumn = (columnType: string | undefined) => {
  if (columnType?.includes('json')) {
    return 'json' as const
  }
  if (columnType?.includes('xml')) {
    return 'xml' as const
  }
}

const copyTextForValue = (
  isRaw: boolean,
  rawValue: string,
  newValue: unknown
) => {
  if (isRaw) {
    return rawValue
  }
  if (typeof newValue === 'string') {
    return newValue
  }
  return JSON.stringify(newValue)
}

const BooleanCellEditor = ({
  newValue,
  setNewValue,
}: {
  newValue: unknown
  setNewValue: (value: unknown) => void
}) => (
  <CellSwitch
    className="w-full justify-center py-4"
    checked={newValue === true}
    onChange={(checked) => setNewValue(checked)}
  />
)

const ListCellEditor = ({
  availableValues,
  canEdit,
  newValue,
  setNewValue,
  scrollRef,
  contentRef,
}: {
  availableValues: string[]
  canEdit: boolean
  newValue: unknown
  setNewValue: (value: unknown) => void
  scrollRef: StickToBottomInstance['scrollRef']
  contentRef: StickToBottomInstance['contentRef']
}) => {
  const selectedValues = Array.isArray(newValue) ? newValue : []
  const comboboxItems = availableValues.map((v) => ({
    label: v,
    value: v,
  }))
  return (
    <div data-mask className="p-2">
      <Combobox
        value={comboboxItems.filter((item) =>
          selectedValues.includes(item.value)
        )}
        items={comboboxItems}
        multiple
        autoHighlight
        disabled={!canEdit}
        onValueChange={(items) => {
          const values = items.map((item) => item.value)
          setNewValue(values)
        }}
      >
        <ComboboxChips>
          <ScrollArea ref={scrollRef} className="max-h-32 overflow-y-auto">
            <div
              ref={contentRef}
              className="flex flex-wrap gap-1.5 *:data-[slot=combobox-chip]:min-h-7 sm:*:data-[slot=combobox-chip]:min-h-6"
            >
              <ComboboxValue>
                {(selectedItems: typeof comboboxItems) =>
                  selectedItems?.map((item) => (
                    <ComboboxChip aria-label={item.label} key={item.value}>
                      {item.label}
                    </ComboboxChip>
                  ))
                }
              </ComboboxValue>
            </div>
          </ScrollArea>
          <ComboboxChipsInput
            aria-label="Select values"
            placeholder={
              selectedValues.length > 0 ? undefined : 'Select values...'
            }
          />
        </ComboboxChips>
        <ComboboxContent side="top">
          <ComboboxEmpty>No values found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

const SelectCellEditor = ({
  availableValues,
  canEdit,
  newValue,
  setNewValue,
}: {
  availableValues?: string[]
  canEdit: boolean
  newValue: unknown
  setNewValue: (value: unknown) => void
}) => (
  <div data-mask className="p-2">
    <Select
      value={!newValue || newValue === 'null' ? null : newValue}
      disabled={!canEdit}
      onValueChange={(selected) => {
        if (selected) {
          setNewValue(selected)
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select value" />
      </SelectTrigger>
      <SelectContent>
        {availableValues?.map((val) => (
          <SelectItem key={val} value={val}>
            {val}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

const CellPopoverToolbar = ({
  isRaw,
  setIsRaw,
  isBig,
  setIsBig,
  rawValue,
  newValue,
  hasUiRender,
  canEdit,
  isNullable,
  isNull,
  onSetNull,
  onQueue,
}: {
  isRaw: boolean
  setIsRaw: Dispatch<SetStateAction<boolean>>
  isBig: boolean
  setIsBig: Dispatch<SetStateAction<boolean>>
  rawValue: string
  newValue: unknown
  hasUiRender: boolean
  canEdit: boolean
  isNullable: boolean
  isNull: boolean
  onSetNull: () => void
  onQueue: () => void
}) => (
  <div className="flex items-center justify-between gap-2 border-t px-1.5 py-1.5">
    <div className="flex items-center gap-1.5">
      {isRaw && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-xs"
                className="text-muted-foreground"
                onClick={() => setIsBig((prev) => !prev)}
              />
            }
          >
            {isBig ? (
              <HugeiconsIcon icon={ArrowShrinkIcon} strokeWidth={2} />
            ) : (
              <HugeiconsIcon icon={ArrowExpandDiagonal02Icon} strokeWidth={2} />
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle size</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger
          render={
            <CopyButton
              size="icon-xs"
              variant="outline"
              className="text-muted-foreground"
              text={copyTextForValue(isRaw, rawValue, newValue)}
            />
          }
        />
        <TooltipContent side="bottom">Copy value</TooltipContent>
      </Tooltip>
      {hasUiRender && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="xs"
                aria-pressed={isRaw}
                className={cn(
                  'text-muted-foreground',
                  isRaw && 'bg-accent text-foreground'
                )}
                onClick={() => setIsRaw((prev) => !prev)}
              />
            }
          >
            Raw
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isRaw ? 'Edit value' : 'Edit raw value'}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    <div className="flex items-center gap-1">
      {canEdit && (
        <>
          {isNullable && (
            <Button
              size="xs"
              variant="secondary"
              disabled={isNull}
              onClick={onSetNull}
            >
              Set <span className="font-mono">null</span>
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger
              render={<Button size="xs" onClick={() => onQueue()} />}
            >
              Apply
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Apply with
              <KbdCtrlEnter userAgent={navigator.userAgent} />
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  </div>
)

const renderCellEditor = ({
  canEdit,
  column,
  contentRef,
  newValue,
  scrollRef,
  setNewValue,
}: {
  canEdit: boolean
  column: ReturnType<typeof useCellContext>['column']
  contentRef: StickToBottomInstance['contentRef']
  newValue: unknown
  scrollRef: StickToBottomInstance['scrollRef']
  setNewValue: (value: unknown) => void
}) => {
  if (column.uiType === 'boolean') {
    return <BooleanCellEditor newValue={newValue} setNewValue={setNewValue} />
  }

  if (column.uiType === 'list' && column.isArray && !!column.availableValues) {
    return (
      <ListCellEditor
        availableValues={column.availableValues}
        canEdit={canEdit}
        newValue={newValue}
        setNewValue={setNewValue}
        scrollRef={scrollRef}
        contentRef={contentRef}
      />
    )
  }

  if (column.uiType === 'select') {
    return (
      <SelectCellEditor
        availableValues={column.availableValues}
        canEdit={canEdit}
        newValue={newValue}
        setNewValue={setNewValue}
      />
    )
  }

  return null
}

export const CellPopoverContent = ({
  isBig,
  setIsBig,
  onClose,
  hasUpdateFn,
  onSetNull,
}: {
  isBig: boolean
  setIsBig: Dispatch<SetStateAction<boolean>>
  onClose: () => void
  hasUpdateFn: boolean
  onSetNull: () => void
}) => {
  const {
    newValue,
    setNewValue,
    rawValue,
    setRawValue,
    value,
    column,
    onQueueValue,
    transformer,
  } = useCellContext()
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const { scrollRef, contentRef } = useStickToBottom({ initial: 'instant' })

  const canEdit = !!column?.isEditable && hasUpdateFn

  const uiRender = renderCellEditor({
    canEdit,
    column,
    contentRef,
    newValue,
    scrollRef,
    setNewValue,
  })

  const [isRaw, setIsRaw] = useState(!uiRender)

  const compactHeight = estimateCompactHeight(
    isRaw ? rawValue : String(newValue ?? '')
  )

  const queue = () => {
    if (!onQueueValue) {
      return
    }

    let nextValue: unknown
    try {
      nextValue = isRaw
        ? transformer.toConnection.fromRaw(rawValue)
        : transformer.toConnection.fromUI(newValue)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid value')
      return
    }

    onQueueValue(nextValue)
    onClose()
  }
  const queueEvent = useEffectEvent(queue)

  const monacoOptions = {
    folding: isBig,
    lineNumbers: isBig ? 'on' : 'off',
    padding: { bottom: 8, top: 8 },
    readOnly: !canEdit,
    scrollBeyondLastLine: false,
    scrollbar: {
      horizontalScrollbarSize: 5,
      verticalScrollbarSize: 5,
    },
    wordWrap: isBig ? 'off' : 'on',
  } satisfies editor.IStandaloneEditorConstructionOptions

  useEffect(() => {
    if (!monacoRef.current) {
      return
    }

    monacoRef.current.focus()

    const model = monacoRef.current.getModel()
    if (model) {
      const lastLine = model.getLineCount()
      monacoRef.current.setPosition({
        column: model.getLineMaxColumn(lastLine),
        lineNumber: lastLine,
      })
    }

    const disposable = monacoRef.current.addAction({
      id: 'tamery.execute-on-enter',
      keybindings: [monacoEnterKeybinding],
      label: 'Execute on Enter',
      run: () => {
        queueEvent()
      },
    })

    return () => disposable.dispose()
  }, [monacoRef])

  useHotkey('Mod+Enter', () => queue(), { enabled: canEdit })

  return (
    <>
      {!isRaw && uiRender ? (
        uiRender
      ) : (
        <Monaco
          ref={monacoRef}
          data-mask
          value={isRaw ? rawValue : String(newValue ?? '')}
          language={monacoLanguageForColumn(column?.type)}
          className={cn(
            'w-full transition-[height] duration-300',
            isBig && 'h-[min(45vh,40rem)]!'
          )}
          style={{ height: compactHeight }}
          onChange={isRaw ? setRawValue : setNewValue}
          options={monacoOptions}
        />
      )}
      <CellPopoverToolbar
        isRaw={isRaw}
        setIsRaw={setIsRaw}
        isBig={isBig}
        setIsBig={setIsBig}
        rawValue={rawValue}
        newValue={newValue}
        hasUiRender={!!uiRender}
        canEdit={canEdit}
        isNullable={!!column?.isNullable}
        isNull={value === null}
        onSetNull={onSetNull}
        onQueue={queue}
      />
    </>
  )
}
