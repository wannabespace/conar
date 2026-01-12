import type { DynamicToolUIPart, ToolUIPart } from 'ai'
import type { editor } from 'monaco-editor'
import type { ComponentType } from 'react'
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
import { memo, useEffect, useState } from 'react'
import { Monaco } from '~/components/monaco'

const ICONS: Record<string, ComponentType> = {
  'tool-webSearch': RiEarthLine,
  'tool-resolveLibrary': RiSearchLine,
  'tool-getLibraryDocs': RiBook2Line,
}

const monacoOptions = {
  readOnly: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'off' as const,
  minimap: { enabled: false },
  folding: false,
} as const satisfies editor.IStandaloneEditorConstructionOptions

function hasErrorProperty(v: unknown): v is { error?: unknown } {
  return typeof v === 'object' && v !== null && 'error' in v
}

function stringify(v: unknown) {
  try {
    return JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? String(x) : x), 2)
  }
  catch {
    return String(v)
  }
}

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
  if (!hasErrorProperty(output))
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

interface ChatMessageToolSectionProps {
  title?: string
  value: unknown
  full: boolean
}

const ChatMessageToolSection = memo<ChatMessageToolSectionProps>(({ title, value, full }) => (
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
      ? (
          <div className="text-muted-foreground italic">Pending…</div>
        )
      : full
        ? (
            <Monaco
              value={stringify(value)}
              language="json"
              className="-mx-2 h-[200px]"
              options={monacoOptions}
            />
          )
        : (
            <div className="break-words text-muted-foreground">{preview(value)}</div>
          )}
  </div>
))

ChatMessageToolSection.displayName = 'ChatMessageToolSection'

interface ChatMessageToolProps {
  part: (ToolUIPart | DynamicToolUIPart) & { input?: unknown, output?: unknown }
  className?: string
}

export const ChatMessageTool = memo<ChatMessageToolProps>(({ part, className }) => {
  const loading = part.state === 'input-streaming' || part.state === 'input-available'
  const error = part.state === 'output-error'
  const name = part.type?.replace('tool-', '') ?? 'tool'

  const errorMsg = error ? extractErrorMessage(part.output) : null

  const Icon = loading ? RiLoader4Line : error ? RiErrorWarningLine : ICONS[part.type ?? ''] ?? RiHammerLine
  const title = error ? `Failed ${name}` : loading ? `Running ${name}` : `Ran ${name}`
  const hasDetails = part.input != null || part.output != null

  const [open, setOpen] = useState(error)
  const [full, setFull] = useState(false)

  useEffect(() => {
    if (error)
      setOpen(true)
  }, [error])

  if (loading || !hasDetails) {
    return (
      <div className={cn('my-2 flex items-center gap-2 text-sm', className)}>
        <Icon className={cn('size-4 shrink-0', loading && `
          animate-spin text-primary
        `)}
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
          <Icon className={cn('size-4 shrink-0', error && 'text-red-600')} />
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
})
