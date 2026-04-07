import type { editor } from 'monaco-editor'
import type { Dispatch, SetStateAction } from 'react'
import { tryParseToJsonArray } from '@conar/shared/utils/helpers'
import { Button } from '@conar/ui/components/button'
import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxEmpty, ComboboxItem, ComboboxList, ComboboxPopup, ComboboxValue } from '@conar/ui/components/combobox'
import { CopyButton } from '@conar/ui/components/custom/copy-button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { KbdCtrlEnter } from '@conar/ui/components/custom/shortcuts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiCollapseDiagonal2Line, RiExpandDiagonal2Line, RiFileCopyLine } from '@remixicon/react'
import { useHotkey } from '@tanstack/react-hotkeys'
import { KeyCode, KeyMod } from 'monaco-editor'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { CellSwitch } from '~/components/cell-switch'
import { Monaco } from '~/components/monaco'
import { getValueForEditor } from '~/entities/connection/transformers/base'
import { useCellContext } from './cell-context'

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
  const { newValue, value, column, setNewValue, onSaveValue, availableValues, transformer } = useCellContext()
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const { scrollRef, contentRef } = useStickToBottom({ initial: 'instant' })

  const [isRaw, setIsRaw] = useState(false)
  const [rawValue, setRawValue] = useState(() => getValueForEditor(value))

  const save = async (val: string, isRaw?: boolean) => {
    if (!onSaveValue)
      return

    onSaveValue(isRaw ? val : transformer.toDb(val))
    onClose()
  }

  const saveEvent = useEffectEvent((val: string) => save(val, isRaw))

  const canEdit = !!column?.isEditable && hasUpdateFn
  const isList = !!availableValues && !!column.isArray
  const activeValue = isRaw ? rawValue : newValue
  const isValueChanged = isRaw ? rawValue !== value : newValue !== transformer.toEditable(value)

  const comboboxItems = availableValues?.map(v => ({ value: v, label: v })) ?? []
  const selectedArrayValues = isList ? tryParseToJsonArray(newValue) : []

  const monacoOptions = {
    lineNumbers: isBig ? 'on' : 'off',
    readOnly: !canEdit,
    wordWrap: isBig ? 'off' : 'on',
    scrollBeyondLastLine: false,
    folding: isBig,
    scrollbar: {
      horizontalScrollbarSize: 5,
      verticalScrollbarSize: 5,
    },
  } satisfies editor.IStandaloneEditorConstructionOptions

  useEffect(() => {
    if (!monacoRef.current)
      return

    monacoRef.current.focus()

    const disposable = monacoRef.current.addAction({
      id: 'conar.execute-on-enter',
      label: 'Execute on Enter',
      keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
      run: (e) => {
        saveEvent(e.getValue() ?? '')
      },
    })

    return () => disposable.dispose()
  }, [monacoRef, isRaw])

  useHotkey('Mod+Enter', () => save(activeValue, isRaw), { enabled: isValueChanged })

  return (
    <>
      {column.uiType === 'raw' || isRaw || (column.uiType === 'list' && !availableValues)
        ? (
            <Monaco
              ref={monacoRef}
              data-mask
              value={isRaw ? rawValue : newValue}
              language={column?.type?.includes('json')
                ? 'json'
                : column?.type?.includes('xml')
                  ? 'xml'
                  : undefined}
              className={cn('h-40 w-full transition-[height] duration-300', isBig && `
                h-[min(45vh,40rem)]
              `)}
              onChange={isRaw ? setRawValue : setNewValue}
              options={monacoOptions}
            />
          )
        : column.uiType === 'boolean'
          ? (
              <CellSwitch
                className="w-full justify-center py-6"
                checked={newValue === 'true'}
                onChange={checked => setNewValue(checked.toString())}
                onSave={val => save(val, isRaw)}
              />
            )
          : column.uiType === 'list'
            ? (
                <div className="p-2">
                  <Combobox
                    value={comboboxItems.filter(item => selectedArrayValues.includes(item.value))}
                    items={comboboxItems}
                    multiple
                    autoHighlight
                    disabled={!canEdit}
                    onValueChange={(items) => {
                      const values = items.map(item => item.value)
                      setNewValue(JSON.stringify(values))
                    }}
                  >
                    <ComboboxChips>
                      <ScrollArea
                        ref={scrollRef}
                        className="max-h-32 overflow-y-auto"
                      >
                        <div
                          ref={contentRef}
                          className="
                            flex flex-wrap gap-1.5
                            *:data-[slot=combobox-chip]:min-h-7
                            sm:*:data-[slot=combobox-chip]:min-h-6
                          "
                        >
                          <ComboboxValue>
                            {(value: typeof comboboxItems) => value?.map(item => (
                              <ComboboxChip aria-label={item.label} key={item.value}>
                                {item.label}
                              </ComboboxChip>
                            ))}
                          </ComboboxValue>
                        </div>
                      </ScrollArea>
                      <ComboboxChipsInput
                        aria-label="Select values"
                        placeholder={selectedArrayValues.length > 0 ? undefined : 'Select values...'}
                      />
                    </ComboboxChips>
                    <ComboboxPopup side="top">
                      <ComboboxEmpty>No values found.</ComboboxEmpty>
                      <ComboboxList>
                        {item => (
                          <ComboboxItem key={item.value} value={item}>
                            {item.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxPopup>
                  </Combobox>
                </div>
              )
            : column.uiType === 'select' && (
              <div className="p-2">
                <Select
                  value={!newValue || newValue === 'null' ? null : newValue}
                  disabled={!canEdit}
                  onValueChange={(value) => {
                    if (value) {
                      setNewValue(value)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableValues?.map(val => (
                      <SelectItem key={val} value={val}>
                        {val}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
      <div className="flex items-center justify-between gap-2 border-t p-2">
        <div className="flex items-center gap-1">
          {isRaw && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => setIsBig(prev => !prev)}
                >
                  {isBig
                    ? <RiCollapseDiagonal2Line className="size-3" />
                    : <RiExpandDiagonal2Line className="size-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Toggle size</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <CopyButton
                size="icon-xs"
                variant="outline"
                text={activeValue}
                copyIcon={<RiFileCopyLine className="size-3" />}
                successIcon={<RiCheckLine className="size-3 text-success" />}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy value</TooltipContent>
          </Tooltip>
          {column.uiType !== 'raw' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setIsRaw(prev => !prev)}
                >
                  Raw
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{isRaw ? 'Edit value' : 'Edit raw value'}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex gap-1">
          {canEdit && (
            <>
              {!!column?.isNullable && (
                <Button
                  size="xs"
                  variant="secondary"
                  disabled={value === null}
                  onClick={onSetNull}
                >
                  Set
                  {' '}
                  <span className="font-mono">null</span>
                </Button>
              )}
              <Button
                size="xs"
                disabled={!isValueChanged}
                onClick={() => save(activeValue)}
              >
                Save
                <KbdCtrlEnter
                  userAgent={navigator.userAgent}
                  className="text-white"
                />
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
