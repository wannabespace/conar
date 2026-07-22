import {
  RiCheckLine,
  RiCollapseDiagonal2Line,
  RiExpandDiagonal2Line,
  RiFileCopyLine,
} from '@remixicon/react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import type { editor } from 'monaco-editor'
import { KeyCode, KeyMod } from 'monaco-editor'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useStickToBottom } from 'use-stick-to-bottom'

import { CellSwitch } from '~/components/cell-switch'
import { Monaco } from '~/components/monaco'

import { useCellContext } from './cell-context'
import { estimateCompactHeight } from './utils'

export function CellPopoverContent({
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
}) {
  const { newValue, setNewValue, rawValue, setRawValue, value, column, onQueueValue, transformer } =
    useCellContext()
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const { scrollRef, contentRef } = useStickToBottom({ initial: 'instant' })

  const canEdit = !!column?.isEditable && hasUpdateFn

  const uiRender = useMemo(() => {
    if (column.uiType === 'boolean') {
      return (
        <CellSwitch
          className="w-full justify-center py-4"
          checked={newValue === true}
          onChange={checked => setNewValue(checked)}
        />
      )
    }

    if (column.uiType === 'list' && column.isArray && !!column.availableValues) {
      const selectedValues = Array.isArray(newValue) ? newValue : []
      const comboboxItems = column.availableValues.map(v => ({ value: v, label: v }))
      return (
        <div data-mask className="p-2">
          <Combobox
            value={comboboxItems.filter(item => selectedValues.includes(item.value))}
            items={comboboxItems}
            multiple
            autoHighlight
            disabled={!canEdit}
            onValueChange={items => {
              const values = items.map(item => item.value)
              setNewValue(values)
            }}
          >
            <ComboboxChips>
              <ScrollArea ref={scrollRef} className="max-h-32 overflow-y-auto">
                <div
                  ref={contentRef}
                  className="
                    flex flex-wrap gap-1.5
                    *:data-[slot=combobox-chip]:min-h-7
                    sm:*:data-[slot=combobox-chip]:min-h-6
                  "
                >
                  <ComboboxValue>
                    {(value: typeof comboboxItems) =>
                      value?.map(item => (
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
                placeholder={selectedValues.length > 0 ? undefined : 'Select values...'}
              />
            </ComboboxChips>
            <ComboboxContent side="top">
              <ComboboxEmpty>No values found.</ComboboxEmpty>
              <ComboboxList>
                {item => (
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

    if (column.uiType === 'select') {
      return (
        <div data-mask className="p-2">
          <Select
            value={!newValue || newValue === 'null' ? null : newValue}
            disabled={!canEdit}
            onValueChange={value => {
              if (value) {
                setNewValue(value)
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {column.availableValues?.map(val => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    return null
  }, [canEdit, column, contentRef, newValue, scrollRef, setNewValue])

  const [isRaw, setIsRaw] = useState(!uiRender)

  const compactHeight = estimateCompactHeight(isRaw ? rawValue : String(newValue ?? ''))

  const queue = async () => {
    if (!onQueueValue) return

    let value: unknown
    try {
      value = isRaw
        ? transformer.toConnection.fromRaw(rawValue)
        : transformer.toConnection.fromUI(newValue)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid value')
      return
    }

    onQueueValue(value)
    onClose()
  }
  const queueEvent = useEffectEvent(queue)

  const monacoOptions = {
    lineNumbers: isBig ? 'on' : 'off',
    readOnly: !canEdit,
    wordWrap: isBig ? 'off' : 'on',
    scrollBeyondLastLine: false,
    folding: isBig,
    padding: { top: 8, bottom: 8 },
    scrollbar: {
      horizontalScrollbarSize: 5,
      verticalScrollbarSize: 5,
    },
  } satisfies editor.IStandaloneEditorConstructionOptions

  useEffect(() => {
    if (!monacoRef.current) return

    monacoRef.current.focus()

    const model = monacoRef.current.getModel()
    if (model) {
      const lastLine = model.getLineCount()
      monacoRef.current.setPosition({
        lineNumber: lastLine,
        column: model.getLineMaxColumn(lastLine),
      })
    }

    const disposable = monacoRef.current.addAction({
      id: 'tamery.execute-on-enter',
      label: 'Execute on Enter',
      keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
      run: () => {
        queueEvent()
      },
    })

    return () => disposable.dispose()
  }, [monacoRef, isRaw])

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
          language={
            column?.type?.includes('json')
              ? 'json'
              : column?.type?.includes('xml')
                ? 'xml'
                : undefined
          }
          className={cn('w-full transition-[height] duration-300', isBig && 'h-[min(45vh,40rem)]!')}
          style={{ height: compactHeight }}
          onChange={isRaw ? setRawValue : setNewValue}
          options={monacoOptions}
        />
      )}
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
                    onClick={() => setIsBig(prev => !prev)}
                  />
                }
              >
                {isBig ? (
                  <RiCollapseDiagonal2Line className="size-3.5" />
                ) : (
                  <RiExpandDiagonal2Line className="size-3.5" />
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
                  text={
                    isRaw
                      ? rawValue
                      : typeof newValue === 'string'
                        ? newValue
                        : JSON.stringify(newValue)
                  }
                  copyIcon={<RiFileCopyLine className="size-3.5" />}
                  successIcon={<RiCheckLine className="size-3.5 text-success" />}
                />
              }
            ></TooltipTrigger>
            <TooltipContent side="bottom">Copy value</TooltipContent>
          </Tooltip>
          {!!uiRender && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="xs"
                    aria-pressed={isRaw}
                    className={cn('text-muted-foreground', isRaw && 'bg-accent text-foreground')}
                    onClick={() => setIsRaw(prev => !prev)}
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
              {!!column?.isNullable && (
                <Button size="xs" variant="secondary" disabled={value === null} onClick={onSetNull}>
                  Set <span className="font-mono">null</span>
                </Button>
              )}
              <Tooltip>
                <TooltipTrigger render={<Button size="xs" onClick={() => queue()} />}>
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
    </>
  )
}
