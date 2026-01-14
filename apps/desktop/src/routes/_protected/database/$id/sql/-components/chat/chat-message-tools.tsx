import type { ToolUIPart } from '@conar/api/ai/tools/helpers'
import type { editor } from 'monaco-editor'
import {
  SingleAccordion,
  SingleAccordionContent,
  SingleAccordionTrigger,
  SingleAccordionTriggerArrow,
} from '@conar/ui/components/custom/single-accordion'
import { cn } from '@conar/ui/lib/utils'
import {
  RiBook2Line,
  RiEarthLine,
  RiErrorWarningLine,
  RiHammerLine,
  RiLoader4Line,
  RiSearchLine,
} from '@remixicon/react'
import { useState } from 'react'
import { Monaco } from '~/components/monaco'

const STATE_ICONS: Record<ToolUIPart['state'], (props: { className?: string, part: ToolUIPart }) => React.ReactNode> = {
  'input-streaming': ({ className }) => (
    <RiLoader4Line className={cn(`animate-spin text-primary`, className)} />
  ),
  'input-available': ({ className }) => (
    <RiLoader4Line className={cn(`animate-spin text-primary`, className)} />
  ),
  'output-available': ({ className, part }) => {
    if (part.type === 'tool-webSearch') {
      return <RiEarthLine className={cn('text-muted-foreground', className)} />
    }
    if (part.type === 'tool-resolveLibraryId') {
      return <RiSearchLine className={cn('text-muted-foreground', className)} />
    }
    if (part.type === 'tool-queryDocs') {
      return <RiBook2Line className={cn('text-muted-foreground', className)} />
    }
    return <RiHammerLine className={cn('text-muted-foreground', className)} />
  },
  'output-error': ({ className }) => (
    <RiErrorWarningLine className={cn(`text-red-600`, className)} />
  ),
  'approval-requested': ({ className }) => (
    <RiLoader4Line className={cn(`animate-spin text-primary`, className)} />
  ),
  'approval-responded': ({ className }) => (
    <RiHammerLine className={cn(`text-muted-foreground`, className)} />
  ),
  'output-denied': ({ className }) => (
    <RiErrorWarningLine className={cn(`text-red-600`, className)} />
  ),
}

const monacoOptions = {
  readOnly: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'off',
  minimap: { enabled: false },
  folding: false,
} as const satisfies editor.IStandaloneEditorConstructionOptions

function preview(v: unknown): string {
  if (v == null)
    return '—'
  if (typeof v === 'string')
    return v.slice(0, 120)
  if (Array.isArray(v))
    return `${v.length} item${v.length !== 1 ? 's' : ''}`
  if (typeof v === 'object') {
    const keys = Object.keys(v)
    return keys.length ? keys.slice(0, 4).join(', ') : 'Empty'
  }
  return String(v).slice(0, 120)
}

function extractErrorMessage(output: unknown): string | null {
  if (typeof output !== 'object' || output === null || !('error' in output))
    return null

  const { error } = output

  if (error == null)
    return null
  if (typeof error === 'string')
    return error
  if (error instanceof Error)
    return error.message

  return preview(error)
}

function ChatMessageToolSection({ title, value, full }: {
  title?: string
  value: unknown
  full: boolean
}) {
  return (
    <div className="space-y-2">
      {title && (
        <div className={`
          text-[11px] font-medium tracking-wider text-muted-foreground uppercase
        `}
        >
          {title}
        </div>
      )}
      {value == null
        ? <div className="text-muted-foreground italic">Pending…</div>
        : full
          ? (
              <Monaco
                value={JSON.stringify(value)}
                language="json"
                className="-mx-2 h-[200px]"
                options={monacoOptions}
              />
            )
          : <div className="wrap-break-word text-muted-foreground">{preview(value)}</div>}
    </div>
  )
}

function getToolTitle({ loading, error, name }: { loading: boolean, error: boolean, name?: string }) {
  if (error)
    return `Failed ${name}`
  if (loading)
    return `Running ${name}`
  return `Ran ${name}`
}

export function ChatMessageTool({ part, className }: {
  part: ToolUIPart
  className?: string
}) {
  const loading = part.state === 'input-streaming' || part.state === 'input-available'
  const error = part.state === 'output-error'
  const name = part.type?.replace('tool-', '') ?? 'tool'

  const errorMsg = error ? extractErrorMessage(part.output) : null

  const Icon = STATE_ICONS[part.state]
  const title = getToolTitle({ loading, error, name })

  const hasDetails = part.input != null || part.output != null

  const [open, setOpen] = useState(error)
  const [full, setFull] = useState(false)

  if (error && !open) {
    setOpen(true)
  }

  if (loading || !hasDetails) {
    return (
      <div className={cn('my-2 flex items-center gap-2 text-sm', className)}>
        <Icon
          className={cn('size-4 shrink-0', loading && `
            animate-spin text-primary
          `)}
          part={part}
        />
        <span className={cn(loading && 'text-muted-foreground')}>{title}</span>
      </div>
    )
  }

  return (
    <SingleAccordion
      className={cn('my-2', className)}
      open={open}
      onOpenChange={error ? undefined : setOpen}
    >
      <SingleAccordionTrigger className="gap-2 py-2" disabled={error}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Icon className={cn('size-4 shrink-0', error && 'text-red-600')} part={part} />
          <span className="truncate text-sm">{title}</span>
        </div>
        {!error && <SingleAccordionTriggerArrow />}
      </SingleAccordionTrigger>

      <SingleAccordionContent>
        <div className="mt-2 space-y-4 text-sm">
          {errorMsg
            ? (
                <div className="space-y-2">
                  <div className={`
                    text-[11px] font-medium tracking-wider text-muted-foreground
                    uppercase
                  `}
                  >
                    Error
                  </div>
                  <div
                    className={`
                      rounded-md border border-destructive/20 bg-destructive/10
                      px-3 py-2 text-sm text-destructive
                    `}
                    role="alert"
                  >
                    {errorMsg}
                  </div>
                </div>
              )
            : (
                <div className="space-y-2">
                  <div className={`
                    text-[11px] font-medium tracking-wider text-muted-foreground
                    uppercase
                  `}
                  >
                    Response
                  </div>
                  <ChatMessageToolSection value={part.output} full={full} />
                </div>
              )}

          {part.input != null && (
            <ChatMessageToolSection title="Parameters" value={part.input} full={full} />
          )}

          <button
            type="button"
            className={`
              rounded-sm text-muted-foreground transition-colors
              hover:text-foreground
              focus-visible:ring-2 focus-visible:ring-ring
              focus-visible:outline-none
            `}
            onClick={() => setFull(v => !v)}
          >
            {full ? 'Show less' : 'Show more'}
          </button>
        </div>
      </SingleAccordionContent>
    </SingleAccordion>
  )
}
