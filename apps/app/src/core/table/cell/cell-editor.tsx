import { Monaco } from '@tamery/monaco/editor'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { Button } from '@tamery/ui/components/button'
import { Popover, PopoverContent } from '@tamery/ui/components/popover'
import { Textarea } from '@tamery/ui/components/textarea'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkeys } from '@tanstack/react-hotkeys'
import type { editor } from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { createTransformer } from '~/core/transformers/create-transformer'
import { isNested } from '~/core/transformers/value-transformer'

import type { CellEdit, GridCursor } from '../cursor'
import { useGridCursorContext } from '../cursor'
import { CellFieldActions } from './cell-field-actions'
import { CellReference } from './cell-reference'
import { CellSelect, isPickColumn } from './cell-select'
import type { Column } from './utils'
import { hasTabularFigures } from './utils'

const NOW_SLICE: Partial<Record<Column['uiType'], [number, number]>> = {
  date: [0, 10],
  datetime: [0, 19],
  time: [11, 19],
}

const codeLanguage = (
  connectionType: ConnectionType,
  { type = '', uiType }: Column,
  value: unknown
) => {
  const { jsonColumnType, xmlColumnType } = capabilitiesOf(connectionType)
  if (jsonColumnType.test(type) || (uiType === 'raw' && isNested(value))) {
    return 'json'
  }
  if (xmlColumnType?.test(type)) {
    return 'xml'
  }
}

interface FieldProps {
  column: Column
  cursor: GridCursor
  edit: CellEdit | null
  readOnly: boolean
}

const TextField = ({ column, cursor, edit, readOnly }: FieldProps) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  const nowSlice = readOnly ? undefined : NOW_SLICE[column.uiType]

  useHotkeys(
    [
      { callback: () => cursor.leave(0, 0), hotkey: 'Enter' },
      {
        callback: () => {
          const field = ref.current
          if (field && !readOnly) {
            field.setRangeText(
              '\n',
              field.selectionStart,
              field.selectionEnd,
              'end'
            )
            cursor.change(field.value)
          }
        },
        hotkey: 'Alt+Enter',
      },
      {
        callback: () => cursor.change(null),
        hotkey: 'Backspace',
        options: {
          enabled: !readOnly && !!column.isNullable && edit?.text === '',
        },
      },
    ],
    { ignoreInputs: false, target: ref }
  )

  return (
    <div
      className={cn(
        'flex min-h-full items-start',
        hasTabularFigures(column) && 'tabular-nums'
      )}
    >
      <Textarea
        ref={ref}
        data-mask
        variant="flat"
        className="max-h-60 min-w-0 flex-1"
        aria-label={`Value of ${column.id}`}
        aria-invalid={!!edit?.error}
        autoFocus
        readOnly={readOnly}
        value={edit?.text ?? ''}
        placeholder={edit?.text === null ? 'null' : 'empty'}
        onChange={(event) => cursor.change(event.target.value)}
        onFocus={({ currentTarget: field }) => {
          field.setSelectionRange(field.value.length, field.value.length)
          field.scrollTop = field.scrollHeight
        }}
      />
      {nowSlice && (
        <Button
          variant="ghost-muted"
          size="xs"
          className="m-1 shrink-0"
          onClick={() => {
            // UTC wall clock: engines read a bare timestamp in the session time zone.
            cursor.change(
              new Date()
                .toISOString()
                .replace('T', ' ')
                .slice(...nowSlice)
            )
            ref.current?.focus()
          }}
        >
          Now
        </Button>
      )}
    </div>
  )
}

const CodeField = ({
  cursor,
  edit,
  language,
  readOnly,
}: FieldProps & { language: string }) => {
  const ref = useRef<editor.IStandaloneCodeEditor>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <div data-mask className="p-0.75">
      <Monaco
        ref={ref}
        className="h-64 w-120"
        language={language}
        value={edit?.text ?? ''}
        onChange={(text) => cursor.change(text)}
        onSubmit={() => cursor.fill()}
        options={{
          lineNumbers: 'off',
          padding: { bottom: 8, top: 8 },
          readOnly,
          scrollBeyondLastLine: false,
          scrollbar: { horizontalScrollbarSize: 5, verticalScrollbarSize: 5 },
          wordWrap: 'on',
        }}
      />
    </div>
  )
}

export const CellField = ({
  anchor,
  column,
  value,
}: {
  anchor: RefObject<HTMLElement | null>
  column: Column
  value: unknown
}) => {
  const cursor = useGridCursorContext()
  const { connectionType } = cursor
  // State, not a ref: the portal mounts the popup a render after this one, and the hotkeys must bind once it exists.
  const [popup, setPopup] = useState<HTMLDivElement | null>(null)
  const edit = useSubscription(cursor.store, {
    selector: (state) => state.edit,
  })
  const transformer = createTransformer(connectionType, column)
  const readOnly = !cursor.isEditable(column)
  const language = codeLanguage(connectionType, column, value)
  const reference =
    isPickColumn(column) || readOnly ? undefined : column.foreign
  const props = { column, cursor, edit, readOnly }

  useHotkeys(
    [
      { callback: () => cursor.fill(), hotkey: 'Mod+Enter' },
      { callback: cursor.cancel, hotkey: 'Escape' },
      // Code fields keep Tab for indenting.
      {
        callback: () => cursor.leave(0, 1),
        hotkey: 'Tab',
        options: { enabled: !language },
      },
      {
        callback: () => cursor.leave(0, -1),
        hotkey: 'Shift+Tab',
        options: { enabled: !language },
      },
    ],
    { enabled: !!popup, ignoreInputs: false, target: popup }
  )

  const field = () => {
    if (isPickColumn(column)) {
      return (
        <CellSelect
          column={column}
          cursor={cursor}
          readOnly={readOnly}
          transformer={transformer}
          value={value}
        />
      )
    }
    if (reference) {
      return (
        <CellReference
          {...props}
          foreign={reference}
          transformer={transformer}
          value={value}
        />
      )
    }
    if (language) {
      return <CodeField {...props} language={language} />
    }
    return <TextField {...props} />
  }

  return (
    <Popover open>
      <PopoverContent
        ref={setPopup}
        anchor={anchor}
        side="bottom"
        align="start"
        sideOffset={({ anchor: cell }) => -cell.height}
        padding="none"
        initialFocus={false}
        finalFocus={false}
        className={cn(
          'min-h-(--anchor-height) overflow-hidden data-closed:animate-none data-open:animate-none',
          // A textarea's min-content is its longest unbroken run, so only a fixed width keeps it wrapping.
          !language &&
            (column.foreign
              ? 'w-[max(var(--anchor-width),--spacing(96))]'
              : 'w-[max(var(--anchor-width),--spacing(72))]'),
          language && 'w-auto'
        )}
        onBlur={(event) => {
          // Leaving the window, or moving focus inside the field, is not leaving the cell.
          const blurred = event.target
          if (
            document.hasFocus() &&
            !event.currentTarget.contains(event.relatedTarget) &&
            !cursor.commit()
          ) {
            requestAnimationFrame(() => blurred.focus())
          }
        }}
        // React bubbles portal events to the grid, whose context menu would open over the field.
        onContextMenu={(event) => event.stopPropagation()}
      >
        {field()}
        {/* A reference's text is a search, and its list already says when nothing matches. */}
        {edit?.error && !reference && (
          <p role="alert" className="text-destructive text-2xs px-2 pb-2">
            {edit.error}
          </p>
        )}
        {!readOnly && (
          <CellFieldActions
            canApply={!!language}
            column={column}
            edit={edit}
            value={value}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
