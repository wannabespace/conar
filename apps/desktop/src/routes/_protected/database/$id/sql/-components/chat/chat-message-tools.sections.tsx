import type { ComponentProps, PropsWithChildren, ReactNode } from 'react'
import type { ToolPart } from './chat-message-tools.utils'
import { cn } from '@conar/ui/lib/utils'
import { memo, useMemo, useState } from 'react'
import { Monaco } from '~/components/monaco'
import {
  isRecord,
  jsonStringifySafe,
  summarize,
} from './chat-message-tools.utils'

const monacoOptions = {
  readOnly: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'off',
  minimap: { enabled: false },
  folding: false,
} as const

const MonacoOutput = memo(function MonacoOutput({ value }: { value: string }) {
  return (
    <Monaco
      value={value}
      language="json"
      options={monacoOptions}
      className="-mx-2 h-[200px] max-h-[50vh]"
    />
  )
})

const SectionTitle = memo(function SectionTitle({ children }: PropsWithChildren) {
  return (
    <div
      className={`
        text-[11px] font-medium tracking-wider text-muted-foreground uppercase
      `}
    >
      {children}
    </div>
  )
})

const ToggleLink = memo(function ToggleLink({
  onClick,
  children,
}: Pick<ComponentProps<'button'>, 'onClick' | 'children'>) {
  return (
    <button
      type="button"
      className={`
        text-sm text-muted-foreground
        hover:text-foreground
      `}
      onClick={onClick}
    >
      {children}
    </button>
  )
})

const ToolHeaderRow = memo(function ToolHeaderRow({
  tool,
  iconRenderer,
  tooltip,
  text,
  title,
}: {
  tool: ToolPart
  iconRenderer: (props: { className?: string, tool: ToolPart }) => ReactNode
  tooltip: string
  text: string
  title?: string
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="shrink-0" title={tooltip}>
        {iconRenderer({ tool, className: 'size-4 shrink-0' })}
      </span>

      <div
        className={`
          min-w-0 flex-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap
        `}
        title={title ?? text}
      >
        {text}
      </div>
    </div>
  )
})

const CompactRow = memo(function CompactRow({
  tool,
  iconRenderer,
  tooltip,
  text,
  className,
  subtle,
}: {
  tool: ToolPart
  iconRenderer: (props: { className?: string, tool: ToolPart }) => ReactNode
  tooltip: string
  text: string
  className?: string
  subtle?: boolean
}) {
  return (
    <div className={cn('my-2 flex min-w-0 items-center gap-2', className)} title={tooltip}>
      <span className="shrink-0">{iconRenderer({ tool, className: 'size-4' })}</span>
      <div
        className={cn(
          `
            min-w-0 flex-1 overflow-hidden text-sm text-ellipsis
            whitespace-nowrap
          `,
          subtle && 'text-muted-foreground',
        )}
      >
        {text}
      </div>
    </div>
  )
})

function KeyValueList({ value, maxEntries }: { value: Record<string, unknown>, maxEntries?: number }) {
  const entries = Object.entries(value)
  if (entries.length === 0)
    return null
  // For preview mode (maxEntries) we sort keys to keep output stable across renders.
  const visible = maxEntries
    ? entries
        .toSorted(([a], [b]) => a.localeCompare(b))
        .slice(0, maxEntries)
    : entries
  return (
    <div className="space-y-1 text-sm">
      {visible.map(([k, v]) => (
        <div key={k} className="flex min-w-0 gap-2">
          <div className="shrink-0 text-muted-foreground">{k}</div>
          <div
            className={`
              min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap
            `}
          >
            {summarize(v) ?? '—'}
          </div>
        </div>
      ))}
      {maxEntries && entries.length > maxEntries && (
        <div className="text-xs text-muted-foreground">
          +
          {entries.length - maxEntries}
          {' '}
          more…
        </div>
      )}
    </div>
  )
}

const ResponseSection = memo(function ResponseSection({
  tool,
  errorText,
}: {
  tool: ToolPart
  errorText: string | null
}) {
  const [showFull, setShowFull] = useState(false)

  const preview = useMemo(() => summarize(tool.output), [tool.output])
  const full = useMemo(
    () => (tool.output !== undefined ? jsonStringifySafe(tool.output) : null),
    [tool.output],
  )
  const outputObj = isRecord(tool.output) ? tool.output : null

  return (
    <div className="space-y-2">
      <SectionTitle>Response</SectionTitle>

      {tool.state === 'output-error' && errorText && (
        <div className="text-xs text-destructive">{errorText}</div>
      )}

      {tool.state !== 'output-error' && tool.output === undefined && (
        <div className="text-sm text-muted-foreground italic">
          Pending response…
        </div>
      )}

      {tool.state !== 'output-error' && tool.output !== undefined && !showFull && (
        <>
          {outputObj
            ? <KeyValueList value={outputObj} maxEntries={4} />
            : <div className="text-sm text-muted-foreground">{preview ?? '—'}</div>}
        </>
      )}

      {tool.output !== undefined && (
        <>
          {showFull && full && <MonacoOutput value={full} />}
          <ToggleLink onClick={() => setShowFull(v => !v)}>
            {showFull ? 'Show less' : 'Show more'}
          </ToggleLink>
        </>
      )}
    </div>
  )
})

const ParametersSection = memo(function ParametersSection({ input }: { input: unknown }) {
  const [showFull, setShowFull] = useState(false)

  const inputObj = isRecord(input) ? input : null
  const preview = useMemo(() => summarize(input), [input])
  const full = useMemo(() => jsonStringifySafe(input), [input])

  return (
    <div className="space-y-2">
      <SectionTitle>Parameters</SectionTitle>

      {!showFull && (
        <>
          {inputObj
            ? <KeyValueList value={inputObj} maxEntries={4} />
            : <div className="text-sm text-muted-foreground">{preview ?? '—'}</div>}
        </>
      )}

      {showFull && (
        <div className="space-y-2">
          {inputObj && <KeyValueList value={inputObj} />}
          <MonacoOutput value={full} />
        </div>
      )}

      <ToggleLink onClick={() => setShowFull(v => !v)}>
        {showFull ? 'Show less' : 'Show more'}
      </ToggleLink>
    </div>
  )
})

export {
  CompactRow,
  ParametersSection,
  ResponseSection,
  ToolHeaderRow,
}
