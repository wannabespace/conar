import {
  AiIdeaIcon,
  Cancel01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AI_SQL_LIMITS } from '@tamery/ai/limits'
import { catalogSummaryFor } from '@tamery/monaco/sql-language'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { fileSize } from '@tamery/shared/files'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@tamery/ui/components/attachment'
import { Button } from '@tamery/ui/components/button'
import { Ctrl, EnterIcon } from '@tamery/ui/components/custom/shortcuts'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@tamery/ui/components/input-group'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { renderWithRoot } from '@tamery/ui/lib/render'
import { cn } from '@tamery/ui/lib/utils'
import { editor as monacoEditor, Range } from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { orpc } from '~/lib/orpc'

const CARD_HEIGHT = 32
const SHADOW_ROOM = 12

type Phase =
  | { kind: 'prompt'; busy: boolean }
  | { kind: 'fixing'; error: string }
  | { kind: 'review'; original: string; applied: string; fix: boolean }

const PastedImage = ({
  image,
  onRemove,
}: {
  image: File
  onRemove: () => void
}) => {
  const url = useMemo(() => URL.createObjectURL(image), [image])
  useEffect(() => () => URL.revokeObjectURL(url), [url])

  return (
    <Attachment size="xs" className="max-w-52">
      <AttachmentMedia variant="image">
        <img data-mask src={url} alt="" />
      </AttachmentMedia>
      <AttachmentContent>
        <Tooltip>
          <TooltipTrigger render={<AttachmentTitle data-mask />}>
            {image.name}
          </TooltipTrigger>
          <TooltipContent data-mask>{image.name}</TooltipContent>
        </Tooltip>
        <AttachmentDescription>{fileSize(image.size)}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove image" onClick={onRemove}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  )
}

const RejectButton = ({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) => (
  <Button size="xs" variant="ghost" onClick={onClick}>
    {label}
    <span className="text-muted-foreground text-2xs font-normal">Esc</span>
  </Button>
)

const AiEditZone = ({
  phase,
  onAccept,
  onClose,
  onResize,
  onSubmit,
}: {
  phase: Phase
  onAccept: () => void
  onClose: () => void
  onResize: (height: number) => void
  onSubmit: (prompt: string, images: File[]) => void
}) => {
  const [images, setImages] = useState<{ file: File; id: string }[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const resize = useEffectEvent(onResize)

  useEffect(() => {
    if (phase.kind === 'prompt') {
      inputRef.current?.focus()
    }
  }, [phase.kind])

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        resize(entry.borderBoxSize[0]?.blockSize ?? CARD_HEIGHT)
      }
    })
    if (formRef.current) {
      observer.observe(formRef.current)
    }
    return () => observer.disconnect()
  }, [])

  const icon = (
    <HugeiconsIcon
      icon={
        phase.kind === 'fixing' || (phase.kind === 'review' && phase.fix)
          ? AiIdeaIcon
          : SparklesIcon
      }
      strokeWidth={2}
      className="text-muted-foreground size-3.5 shrink-0"
    />
  )

  return (
    <form
      ref={formRef}
      className={cn(
        'mt-1.5 ml-3 w-lg max-w-[calc(100%-2.5rem)]',
        phase.kind !== 'prompt' &&
          'bg-popover ring-foreground/4 flex h-8 items-center gap-2 rounded-xl pr-1.5 pl-2.5 shadow-md ring'
      )}
      onSubmit={(event) => {
        event.preventDefault()
        const prompt = inputRef.current?.value.trim() ?? ''
        if (prompt || images.length > 0) {
          onSubmit(
            prompt,
            images.map(({ file }) => file)
          )
        }
      }}
    >
      {phase.kind === 'prompt' && (
        <InputGroup className="shadow-md">
          <InputGroupTextarea
            ref={inputRef}
            data-mask
            rows={1}
            className="max-h-32 min-h-8 py-1.5 pr-10 pl-8 read-only:opacity-50"
            placeholder="Describe how to change this statement…"
            // Read-only, not disabled: a disabled input drops focus, and Esc must still cancel the request.
            readOnly={phase.busy}
            spellCheck={false}
            onPaste={(event) => {
              const pasted = [...event.clipboardData.files].filter((file) =>
                file.type.startsWith('image/')
              )
              if (pasted.length === 0) {
                return
              }
              event.preventDefault()
              const fitting = pasted.filter(
                (file) => file.size <= AI_SQL_LIMITS.imageBytes
              )
              if (fitting.length < pasted.length) {
                toast.error('Images over 5 MB are left out')
              }
              setImages((current) =>
                [
                  ...current,
                  ...fitting.map((file) => ({ file, id: crypto.randomUUID() })),
                ].slice(0, AI_SQL_LIMITS.images)
              )
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation()
                onClose()
              }
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault()
                formRef.current?.requestSubmit()
              }
            }}
          />
          {images.length > 0 && (
            <InputGroupAddon align="block-end" className="pr-9 pl-8">
              <AttachmentGroup className="w-full">
                {images.map(({ file, id }) => (
                  <PastedImage
                    key={id}
                    image={file}
                    onRemove={() =>
                      setImages((current) =>
                        current.filter((item) => item.id !== id)
                      )
                    }
                  />
                ))}
              </AttachmentGroup>
            </InputGroupAddon>
          )}
          <div className="absolute top-2.25 left-2.5 flex">{icon}</div>
          <div className="absolute right-1 bottom-1 flex">
            {phase.busy ? (
              <Spinner className="text-muted-foreground m-1.25 size-3.5" />
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <InputGroupButton
                      type="submit"
                      size="icon-xs"
                      aria-label="Send"
                      className="text-muted-foreground hover:text-foreground"
                    />
                  }
                >
                  <EnterIcon />
                </TooltipTrigger>
                <TooltipContent>Send</TooltipContent>
              </Tooltip>
            )}
          </div>
        </InputGroup>
      )}
      {phase.kind === 'fixing' && (
        <>
          {icon}
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
            Fixing <span data-mask>{phase.error}</span>
          </span>
          <Spinner className="text-muted-foreground size-3.5" />
          <RejectButton label="Cancel" onClick={onClose} />
        </>
      )}
      {phase.kind === 'review' && (
        <>
          {icon}
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
            {phase.fix ? 'Review the fix' : 'Review the rewrite'}
          </span>
          <RejectButton label="Reject" onClick={onClose} />
          <Button size="xs" onClick={onAccept}>
            Accept
            <span className="text-primary-foreground/70 flex items-center">
              <Ctrl userAgent={navigator.userAgent} className="size-2.5" />
              <EnterIcon className="size-2.5" />
            </span>
          </Button>
        </>
      )}
    </form>
  )
}

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
