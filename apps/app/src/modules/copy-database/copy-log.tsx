import {
  Alert02Icon,
  CornerDownRightIcon,
  DatabaseIcon,
  InformationCircleIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { cn } from '@tamery/ui/lib/utils'
import { useStickToBottom } from 'use-stick-to-bottom'

import { formatClockTime } from '~/utils/clock-time'

export interface CopyLogEntry {
  kind: 'created' | 'copied' | 'error' | 'warning' | 'detail' | 'info'
  label: string | null
  text: string
}

export type CopyLogLine = CopyLogEntry & { at: Date }

const CREATED = /^creating (?<label>.+?) "(?<name>.+)"$/u
const COPIED = /^dumping contents of table "(?<name>.+)"$/u
const TOOL_PROBLEM = /^(?:pg_dump|psql): (?<kind>error|warning): (?<text>.*)$/u
const SERVER_MESSAGE =
  /^(?:psql:[^:]*:\d+: )?(?<kind>ERROR|FATAL|WARNING|DETAIL|NOTICE|HINT):\s+(?<text>.*)$/u
const SERVER_KINDS: Record<string, CopyLogEntry['kind'] | null> = {
  DETAIL: 'detail',
  ERROR: 'error',
  FATAL: 'error',
  HINT: null,
  NOTICE: null,
  WARNING: 'warning',
}

/** `null` for pg_dump's catalog reads and the server's notices and hints, which name nothing a user picked. */
export const parseCopyLogLine = (line: string): CopyLogEntry | null => {
  const problem = TOOL_PROBLEM.exec(line)?.groups
  if (problem) {
    return {
      kind: problem.kind === 'error' ? 'error' : 'warning',
      label: null,
      text: problem.text ?? '',
    }
  }
  if (line.startsWith('pg_dump: ')) {
    const step = line.slice('pg_dump: '.length)
    const created = CREATED.exec(step)?.groups
    if (created) {
      return {
        kind: 'created',
        label: created.label?.toLowerCase() ?? null,
        text: created.name ?? '',
      }
    }
    const copied = COPIED.exec(step)?.groups
    return copied
      ? { kind: 'copied', label: 'data', text: copied.name ?? '' }
      : null
  }
  const message = SERVER_MESSAGE.exec(line)?.groups
  if (message) {
    const kind = SERVER_KINDS[message.kind ?? '']
    return kind ? { kind, label: null, text: message.text ?? '' } : null
  }
  return { kind: 'info', label: null, text: line }
}

const isProblem = ({ kind }: CopyLogEntry) =>
  kind === 'error' || kind === 'detail'

/** A failure reaches the log twice, as the tool's own lines and as the copy's error, in either order, so a problem already shown is not repeated. */
export const appendCopyLog = (
  previous: CopyLogLine[],
  next: CopyLogEntry[]
): CopyLogLine[] => [
  ...previous,
  ...next
    .filter(
      (entry) =>
        !isProblem(entry) ||
        !previous.some(
          (seen) => seen.kind === entry.kind && seen.text === entry.text
        )
    )
    .map((entry) => ({ ...entry, at: new Date() })),
]

export const toFailureEntries = (error: Error): CopyLogEntry[] =>
  error.message.split('\n').map((line) => {
    const entry = parseCopyLogLine(line)
    return entry && entry.kind !== 'info'
      ? entry
      : { kind: 'error', label: null, text: line }
  })

const KIND_ICONS = {
  copied: DatabaseIcon,
  created: PlusSignIcon,
  detail: CornerDownRightIcon,
  error: Alert02Icon,
  info: InformationCircleIcon,
  warning: Alert02Icon,
}

const KIND_TONES: Partial<Record<CopyLogEntry['kind'], string>> = {
  error: 'text-destructive',
  warning: 'text-warning',
}

export const CopyLog = ({ entries }: { entries: CopyLogLine[] }) => {
  const { contentRef, scrollRef } = useStickToBottom({ initial: 'instant' })

  return (
    <div className="bg-input ring-foreground/4 overflow-hidden rounded-xl ring">
      <ScrollArea ref={scrollRef} className="h-52">
        <ol
          ref={contentRef}
          data-mask
          className="space-y-1 p-3 font-mono text-xs leading-4 select-text"
        >
          {entries.map(({ at, kind, label, text }, index) => (
            // The log only grows, so a line keeps its index.
            // oxlint-disable-next-line react/no-array-index-key
            <li key={index} className="flex gap-2.5">
              <time className="text-muted-foreground/70 shrink-0 tabular-nums">
                {formatClockTime(at)}
              </time>
              <HugeiconsIcon
                icon={KIND_ICONS[kind]}
                strokeWidth={2}
                className={cn(
                  'mt-px size-3.5 shrink-0',
                  KIND_TONES[kind] ?? 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'min-w-0 flex-1 wrap-break-word',
                  KIND_TONES[kind]
                )}
              >
                {label && (
                  <span className="text-muted-foreground">{label} </span>
                )}
                {text}
              </span>
            </li>
          ))}
        </ol>
      </ScrollArea>
    </div>
  )
}
