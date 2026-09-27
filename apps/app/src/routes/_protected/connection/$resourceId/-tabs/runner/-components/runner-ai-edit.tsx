import { AI_SQL_LIMITS } from '@tamery/ai/limits'
import { catalogSummaryFor } from '@tamery/monaco/sql-language'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { renderWithRoot } from '@tamery/ui/lib/render'
import { editor as monacoEditor, Range } from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'

import { orpc } from '~/lib/orpc'

import { AiEditZone } from './runner-ai-edit-zone'
import type { Phase } from './runner-ai-edit-zone'

const CARD_HEIGHT = 32
const SHADOW_ROOM = 12
export const useAiEdit = ({
  editorRef,
  connectionType,
}: {
  editorRef: RefObject<monacoEditor.IStandaloneCodeEditor | null>
  connectionType: ConnectionType
}) => {
  const [phase, setPhase] = useState<Phase | null>(null)
  const zoneRef = useRef<{
    id: string
    root: ReturnType<typeof renderWithRoot>['root']
    zone: monacoEditor.IViewZone
  } | null>(null)
  // A decoration, not a stored Range: it moves with edits made elsewhere while the AI works.
  const targetRef = useRef<monacoEditor.IEditorDecorationsCollection | null>(
    null
  )
  // Replies are matched to the request that is still current; a closed or replaced one is dropped.
  const requestRef = useRef<AbortController | null>(null)

  const target = () => targetRef.current?.getRange(0) ?? null

  const track = (range: Range, reviewing: boolean) => {
    const editor = editorRef.current
    if (!editor) {
      return
    }
    if (!targetRef.current) {
      targetRef.current = editor.createDecorationsCollection()
    }
    targetRef.current.set([
      {
        options: {
          className: reviewing ? 'sql-ai-band' : undefined,
          isWholeLine: true,
          stickiness:
            monacoEditor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
        range,
      },
    ])
  }

  const close = () => {
    requestRef.current?.abort()
    requestRef.current = null
    const editor = editorRef.current
    const zone = zoneRef.current
    if (editor && zone) {
      editor.changeViewZones((accessor) => accessor.removeZone(zone.id))
      queueMicrotask(() => zone.root.unmount())
    }
    zoneRef.current = null
    targetRef.current?.clear()
    setPhase(null)
  }

  const closeAndFocus = () => {
    close()
    editorRef.current?.focus()
  }

  const revert = () => {
    const editor = editorRef.current
    const range = target()
    if (editor && range && phase?.kind === 'review') {
      if (editor.getModel()?.getValueInRange(range) === phase.applied) {
        editor.executeEdits('ai-reject', [{ range, text: phase.original }])
      } else {
        toast.info('Kept your edits to the rewrite')
      }
    }
  }

  const reject = () => {
    revert()
    closeAndFocus()
  }

  const review = (original: string, text: string, fix: boolean) => {
    const editor = editorRef.current
    const model = editor?.getModel()
    const range = target()
    if (!editor || !model || !range) {
      return
    }
    if (model.getValueInRange(range) !== original) {
      toast.info('The statement changed while the AI was working')
      closeAndFocus()
      return
    }
    if (text.trim() === original.trim()) {
      toast.info(fix ? 'The AI found nothing to fix' : 'Nothing to change')
      closeAndFocus()
      return
    }
    editor.executeEdits('ai-edit', [{ range, text }])
    editor.pushUndoStop()
    const startOffset = model.getOffsetAt(range.getStartPosition())
    track(
      Range.fromPositions(
        model.getPositionAt(startOffset),
        model.getPositionAt(startOffset + text.length)
      ),
      true
    )
    setPhase({ applied: text, fix, kind: 'review', original })
    // The prompt input unmounts on review; without focus back in the editor ⌘↩ and Esc reach nothing.
    editor.focus()
  }

  const request = async (
    range: Range,
    pending: Phase,
    call: (
      input: {
        context: string
        editor: string
        sql: string
        type: ConnectionType
      },
      signal: AbortSignal
    ) => Promise<string>
  ) => {
    const model = editorRef.current?.getModel()
    if (!model) {
      return
    }
    const original = model.getValueInRange(range)
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    track(range, false)
    setPhase(pending)
    try {
      const context = await catalogSummaryFor(model, original)
      const text = await call(
        {
          context,
          editor: model.getValue().slice(0, AI_SQL_LIMITS.sql),
          sql: original,
          type: connectionType,
        },
        controller.signal
      )
      if (requestRef.current === controller) {
        review(original, text, pending.kind === 'fixing')
      }
    } catch (error) {
      if (requestRef.current === controller) {
        toast.error(error instanceof Error ? error.message : String(error))
        closeAndFocus()
      }
    }
  }

  const open = (range: Range) => {
    close()
    track(range, false)
    setPhase({ busy: false, kind: 'prompt' })
  }

  const fix = (range: Range, error: string) => {
    close()
    // Fixing has no input to hold focus, so Esc reaches the editor's reject binding instead.
    editorRef.current?.focus()
    return request(range, { error, kind: 'fixing' }, (input, signal) =>
      orpc.ai.fixSQL.call({ ...input, error }, { signal })
    )
  }

  const accept = () => {
    if (phase?.kind === 'review') {
      closeAndFocus()
    }
  }

  const submit = (prompt: string, images: File[]) => {
    const range = target()
    if (range) {
      request(range, { busy: true, kind: 'prompt' }, (input, signal) =>
        orpc.ai.updateSQL.call({ ...input, images, prompt }, { signal })
      )
    }
  }

  const resizeZone = (cardHeight: number) => {
    const editor = editorRef.current
    const { current } = zoneRef
    if (!editor || !current) {
      return
    }
    current.zone.heightInPx = cardHeight + SHADOW_ROOM
    editor.changeViewZones((accessor) => accessor.layoutZone(current.id))
  }

  useEffect(() => {
    const editor = editorRef.current
    const range = target()
    if (!editor || !phase || !range) {
      return
    }
    const element = (
      <AiEditZone
        phase={phase}
        onAccept={accept}
        onClose={reject}
        onResize={resizeZone}
        onSubmit={submit}
      />
    )
    if (zoneRef.current) {
      zoneRef.current.root.render(element)
      return
    }
    const { domNode, root } = renderWithRoot(element)
    domNode.style.zIndex = '10'
    const zone = {
      afterLineNumber: range.startLineNumber - 1,
      domNode,
      heightInPx: CARD_HEIGHT + SHADOW_ROOM,
    }
    editor.changeViewZones((accessor) => {
      zoneRef.current = { id: accessor.addZone(zone), root, zone }
    })
  })

  const closeIfDeleted = useEffectEvent(() => {
    const range = target()
    if (
      range &&
      !editorRef.current?.getModel()?.getValueInRange(range).trim()
    ) {
      close()
    }
  })

  const active = phase !== null

  useEffect(() => {
    if (!active) {
      return
    }
    const listener = editorRef.current?.onDidChangeModelContent(() =>
      queueMicrotask(closeIfDeleted)
    )
    return () => listener?.dispose()
  }, [active, editorRef])

  const discardOnUnmount = useEffectEvent(() => {
    revert()
    close()
  })

  useEffect(() => () => discardOnUnmount(), [])

  return {
    accept,
    editing: phase !== null,
    fix,
    open,
    reject,
    reviewing: phase?.kind === 'review' || phase?.kind === 'fixing',
  }
}
