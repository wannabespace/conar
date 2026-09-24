import { SparklesIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { catalogSummary } from '@tamery/sql'
import { Button } from '@tamery/ui/components/button'
import { Ctrl, EnterIcon } from '@tamery/ui/components/custom/shortcuts'
import { Kbd } from '@tamery/ui/components/kbd'
import { Spinner } from '@tamery/ui/components/spinner'
import { renderWithRoot } from '@tamery/ui/lib/render'
import { editor as monacoEditor, Range } from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { ConnectionResource } from '~/entities/connection/core/sync'
import { sqlCatalogOf } from '~/entities/connection/sql-language'
import { orpc } from '~/lib/orpc'

// Room for the card's shadow: the gutter layer paints over anything left of the content.
const ZONE_HEIGHT = 44

type Phase =
  | { kind: 'prompt'; busy: boolean }
  | { kind: 'review'; original: string; applied: string }

/** Detached React root inside a Monaco view zone: props only, no context reaches it. */
const AiEditZone = ({
  phase,
  onAccept,
  onClose,
  onSubmit,
}: {
  phase: Phase
  onAccept: () => void
  onClose: () => void
  onSubmit: (prompt: string) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase.kind === 'prompt') {
      inputRef.current?.focus()
    }
  }, [phase.kind])

  return (
    <form
      className="bg-popover ring-foreground/4 mt-1.5 ml-3 flex h-8 w-lg max-w-[calc(100%-2.5rem)] items-center gap-2 rounded-xl pr-1.5 pl-2.5 shadow-md ring"
      onSubmit={(event) => {
        event.preventDefault()
        const prompt = inputRef.current?.value.trim()
        if (prompt) {
          onSubmit(prompt)
        }
      }}
    >
      <HugeiconsIcon
        icon={SparklesIcon}
        strokeWidth={2}
        className="text-muted-foreground size-3.5 shrink-0"
      />
      {phase.kind === 'review' ? (
        <>
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
            Review the rewrite
          </span>
          <Button size="xs" variant="ghost" onClick={onClose}>
            Reject
            <span className="text-muted-foreground text-2xs font-normal">
              Esc
            </span>
          </Button>
          <Button size="xs" onClick={onAccept}>
            Accept
            <span className="text-primary-foreground/70 flex items-center">
              <Ctrl userAgent={navigator.userAgent} className="size-2.5" />
              <EnterIcon className="size-2.5" />
            </span>
          </Button>
        </>
      ) : (
        <>
          <input
            ref={inputRef}
            data-mask
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none read-only:opacity-50"
            placeholder="Describe how to change this statement…"
            // Read-only, not disabled: a disabled input drops focus, and Esc must still cancel the request.
            readOnly={phase.busy}
            spellCheck={false}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation()
                onClose()
              }
            }}
          />
          {phase.busy ? (
            <Spinner className="text-muted-foreground size-3.5" />
          ) : (
            <Kbd>
              <EnterIcon />
            </Kbd>
          )}
        </>
      )}
    </form>
  )
}

/** ⌘K rewrite and "Fix with AI": the rewrite lands in the editor with a band and Accept/Reject above it. */
export const useAiEdit = ({
  editorRef,
  connectionResource,
  connectionType,
}: {
  editorRef: RefObject<monacoEditor.IStandaloneCodeEditor | null>
  connectionResource: ConnectionResource
  connectionType: ConnectionType
}) => {
  const [phase, setPhase] = useState<Phase | null>(null)
  const zoneRef = useRef<{
    id: string
    root: ReturnType<typeof renderWithRoot>['root']
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

  /** Undoes only the AI's text; if the user has edited it since, their edit stays. */
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

  const review = (original: string, text: string) => {
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
    setPhase({ applied: text, kind: 'review', original })
    // The prompt input unmounts on review; without focus back in the editor ⌘↩ and Esc reach nothing.
    editor.focus()
  }

  const request = async (
    range: Range,
    call: (sql: string, signal: AbortSignal) => Promise<string>
  ) => {
    const original = editorRef.current?.getModel()?.getValueInRange(range)
    if (original === undefined) {
      return
    }
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    track(range, false)
    setPhase({ busy: true, kind: 'prompt' })
    try {
      const text = await call(original, controller.signal)
      if (requestRef.current === controller) {
        review(original, text)
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
    return request(range, (sql, signal) =>
      orpc.ai.fixSQL.call(
        {
          context: catalogSummary(
            sqlCatalogOf(connectionResource, connectionType)
          ),
          error,
          sql,
          type: connectionType,
        },
        { signal }
      )
    )
  }

  const accept = () => {
    if (phase?.kind === 'review') {
      closeAndFocus()
    }
  }

  const submit = (prompt: string) => {
    const range = target()
    if (range) {
      request(range, (sql, signal) =>
        orpc.ai.updateSQL.call(
          {
            context: catalogSummary(
              sqlCatalogOf(connectionResource, connectionType)
            ),
            prompt,
            sql,
            type: connectionType,
          },
          { signal }
        )
      )
    }
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
        onSubmit={submit}
      />
    )
    if (zoneRef.current) {
      zoneRef.current.root.render(element)
      return
    }
    const { domNode, root } = renderWithRoot(element)
    domNode.style.zIndex = '10'
    editor.changeViewZones((accessor) => {
      zoneRef.current = {
        id: accessor.addZone({
          afterLineNumber: range.startLineNumber - 1,
          domNode,
          heightInPx: ZONE_HEIGHT,
        }),
        root,
      }
    })
  })

  const discardOnUnmount = useEffectEvent(() => {
    revert()
    close()
  })
  // Leaving the tab mid-edit must not strand the zone's React root, apply a late reply or keep an
  // unreviewed rewrite. Runs before the editor below is disposed: React unmounts parents first.
  useEffect(() => () => discardOnUnmount(), [])

  return {
    accept,
    editing: phase !== null,
    fix,
    open,
    reject,
    reviewing: phase?.kind === 'review',
  }
}
