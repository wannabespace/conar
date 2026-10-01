import { drawnGhostTextElement } from '@tamery/monaco/sql-language'
import { statementAt } from '@tamery/sql'
import { getRouteApi } from '@tanstack/react-router'
import { editor } from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useEffectEvent } from 'react'

import { runnerStatements, useRunnerTab } from './store'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

// Injected after the statement's last line so typed text pushes the Run button along instead of running under it.
const RUN_SLOT = '\u00A0'.repeat(8)
export const RUN_SLOT_GAP = 12
// Sync with the kit button's `icon-2xs` height; a translate would fight the press nudge.
const RUN_BUTTON_HEIGHT = 20
const RUN_SLOT_CLASS = 'sql-run-slot'

export interface RunAnchor {
  top: number
  left: number
  start: number
  source: string
  suggestion: { left: number; top: number } | null
}

export const sameSpot = (
  a: { left: number; top: number } | null | undefined,
  b: { left: number; top: number } | null | undefined
) => a?.left === b?.left && a?.top === b?.top

export const useStatementBand = (
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>,
  onMove: (anchor: RunAnchor | null) => void
) => {
  const move = useEffectEvent(onMove)
  const { connection } = useRouteContext()
  const statements = runnerStatements({
    ...useRunnerTab(),
    connectionType: connection.type,
  })

  useEffect(() => {
    const codeEditor = editorRef.current
    if (!codeEditor) {
      return
    }
    const band = codeEditor.createDecorationsCollection()
    let frame = 0
    let active = { source: '', start: 0 }

    // The slot may wrap to its own visual row and the ghost text re-renders as it streams in,
    // so read where Monaco actually drew whichever anchors the controls.
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const suggestion = drawnGhostTextElement(codeEditor)
        const slot = codeEditor
          .getDomNode()
          ?.querySelector(`.${RUN_SLOT_CLASS}`)
        const root = codeEditor.getDomNode()?.getBoundingClientRect()
        if (!root) {
          return
        }
        const spot = (rect: DOMRect, left: number) => ({
          left: left - root.left,
          top: rect.top + (rect.height - RUN_BUTTON_HEIGHT) / 2 - root.top,
        })
        const suggestionRect = suggestion?.getBoundingClientRect()
        const suggestionSpot = suggestionRect
          ? spot(suggestionRect, suggestionRect.right)
          : null
        const slotRect = slot?.getBoundingClientRect()
        const statementSpot = slotRect
          ? spot(slotRect, slotRect.left)
          : suggestionSpot
        move(
          statementSpot
            ? { ...active, ...statementSpot, suggestion: suggestionSpot }
            : null
        )
      })
    }

    const paint = () => {
      const model = codeEditor.getModel()
      const position = codeEditor.getPosition()
      if (!model || !position) {
        return
      }
      const statement = statementAt(
        statements.get(),
        model.getOffsetAt(position),
        model.getValue()
      )
      // Monaco paints a selection across injected text, so the slot and button step aside while one exists.
      if (!statement || !codeEditor.getSelection()?.isEmpty()) {
        cancelAnimationFrame(frame)
        move(null)
        band.clear()
        return
      }
      active = { source: statement.text, start: statement.start }
      const startLine = model.getPositionAt(statement.start).lineNumber
      const endLine = model.getPositionAt(statement.terminatorEnd).lineNumber
      const endColumn = model.getLineMaxColumn(endLine)
      const ghost = drawnGhostTextElement(codeEditor)
      band.set([
        {
          options: { className: 'sql-active-band', isWholeLine: true },
          range: {
            endColumn: 1,
            endLineNumber: endLine,
            startColumn: 1,
            startLineNumber: startLine,
          },
        },
        // Ghost text at the statement's end renders after injected text at the same column, so the
        // slot yields to it and the buttons follow the suggestion; mid-line ghost text keeps the slot.
        ...(ghost &&
        position.lineNumber === endLine &&
        position.column === endColumn
          ? []
          : [
              {
                options: {
                  after: {
                    content: RUN_SLOT,
                    // The caret never lands past the slot, so a click beyond the button still types before it.
                    cursorStops: editor.InjectedTextCursorStops.Left,
                    inlineClassName: RUN_SLOT_CLASS,
                  },
                  showIfCollapsed: true,
                },
                range: {
                  endColumn,
                  endLineNumber: endLine,
                  startColumn: endColumn,
                  startLineNumber: endLine,
                },
              },
            ]),
      ])
      measure()
    }

    paint()
    const unsubscribe = statements.subscribe(paint)
    const cursorListener = codeEditor.onDidChangeCursorSelection(paint)
    const scrollListener = codeEditor.onDidScrollChange(paint)
    const layoutListener = codeEditor.onDidLayoutChange(paint)
    // View zones (the AI card) shift lines without a cursor, scroll or layout event.
    const sizeListener = codeEditor.onDidContentSizeChange(paint)
    // Ghost text comes and goes with no editor event of its own.
    let hadGhost = false
    const ghostObserver = new MutationObserver(() => {
      const hasGhost = drawnGhostTextElement(codeEditor) !== null
      if (hasGhost !== hadGhost) {
        hadGhost = hasGhost
        paint()
      } else if (hasGhost) {
        measure()
      }
    })
    const root = codeEditor.getDomNode()
    if (root) {
      // No `attributes`: the caret blink rewrites a style attribute twice a second.
      ghostObserver.observe(root, {
        characterData: true,
        childList: true,
        subtree: true,
      })
    }

    return () => {
      unsubscribe()
      cursorListener.dispose()
      scrollListener.dispose()
      layoutListener.dispose()
      sizeListener.dispose()
      ghostObserver.disconnect()
      cancelAnimationFrame(frame)
      band.clear()
    }
  }, [editorRef, statements])
}
