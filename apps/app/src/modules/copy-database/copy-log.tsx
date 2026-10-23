import {
  Alert02Icon,
  CornerDownRightIcon,
  Download04Icon,
  FlashIcon,
  FolderOpenIcon,
  HashtagIcon,
  Key01Icon,
  LayoutTable02Icon,
  LeftToRightListDashIcon,
  Link01Icon,
  SecurityCheckIcon,
  SourceCodeIcon,
  TagsIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { cn } from '@tamery/ui/lib/utils'
import { useStickToBottom } from 'use-stick-to-bottom'

import { formatClockTime } from '~/utils/clock-time'

export interface CopyLogEntry {
  kind: 'step' | 'error' | 'warning' | 'detail' | 'info'
  /** pg_dump's name for the object a step creates, or `TABLE DATA` for copied rows. */
  object: string | null
  text: string
}

export type CopyLogLine = CopyLogEntry & { at: Date }

const CREATED = /^creating (?<object>.+?) "(?<name>.+)"$/u
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
const HIDDEN_OBJECTS = new Set([
  'COMMENT',
  'DEFAULT',
  'SEQUENCE OWNED BY',
  'TABLE ATTACH',
])

/** `null` for pg_dump's catalog reads, column and partition plumbing, and the server's notices and hints, which name nothing a user picked. */
export const parseCopyLogLine = (line: string): CopyLogEntry | null => {
  const problem = TOOL_PROBLEM.exec(line)?.groups
  if (problem) {
    return {
      kind: problem.kind === 'error' ? 'error' : 'warning',
      object: null,
      text: problem.text ?? '',
    }
  }
  if (line.startsWith('pg_dump: ')) {
    const step = line.slice('pg_dump: '.length)
    const created = CREATED.exec(step)?.groups
    if (created) {
      return HIDDEN_OBJECTS.has(created.object ?? '')
        ? null
        : {
            kind: 'step',
            object: created.object ?? null,
            text: created.name ?? '',
          }
    }
    const copied = COPIED.exec(step)?.groups
    return copied
      ? { kind: 'step', object: 'TABLE DATA', text: copied.name ?? '' }
      : null
  }
  const message = SERVER_MESSAGE.exec(line)?.groups
  if (message) {
    const kind = SERVER_KINDS[message.kind ?? '']
    return kind ? { kind, object: null, text: message.text ?? '' } : null
  }
  return { kind: 'info', object: null, text: line }
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
      : { kind: 'error', object: null, text: line }
  })

const OBJECT_ICONS: Record<string, IconSvgElement> = {
  AGGREGATE: SourceCodeIcon,
  CONSTRAINT: Key01Icon,
  DOMAIN: TagsIcon,
  'FK CONSTRAINT': Link01Icon,
  FUNCTION: SourceCodeIcon,
  INDEX: LeftToRightListDashIcon,
  'MATERIALIZED VIEW': ViewIcon,
  POLICY: SecurityCheckIcon,
  PROCEDURE: SourceCodeIcon,
  SCHEMA: FolderOpenIcon,
  SEQUENCE: HashtagIcon,
  TABLE: LayoutTable02Icon,
  'TABLE DATA': Download04Icon,
  TRIGGER: FlashIcon,
  TYPE: TagsIcon,
  VIEW: ViewIcon,
}

/** pg_dump names these `"schema.table name"`; every other object is `"schema.name"`, whose arguments may hold spaces. */
const TABLE_OWNED = new Set([
  'CONSTRAINT',
  'FK CONSTRAINT',
  'INDEX',
  'POLICY',
  'TRIGGER',
])

const PROBLEM_ICONS = {
  detail: { className: 'text-muted-foreground', icon: CornerDownRightIcon },
  error: { className: 'text-destructive', icon: Alert02Icon },
  warning: { className: 'text-warning', icon: Alert02Icon },
}

const EntryIcon = ({ kind, object }: CopyLogEntry) => {
  const { className, icon } =
    kind === 'step' || kind === 'info'
      ? {
          className: 'text-muted-foreground',
          icon: object ? OBJECT_ICONS[object] : undefined,
        }
      : PROBLEM_ICONS[kind]
  if (!icon) {
    return (
      <span className="flex h-4 w-3.5 shrink-0 items-center justify-center">
        <span className="bg-foreground/20 size-1.5 rounded-full" />
      </span>
    )
  }
  return (
    <HugeiconsIcon
      icon={icon}
      aria-label={object?.toLowerCase()}
      strokeWidth={2}
      className={cn('mt-px size-3.5 shrink-0', className)}
    />
  )
}

const EntryText = ({ kind, object, text }: CopyLogEntry) => {
  if (kind !== 'step') {
    return text
  }
  const space = text.indexOf(' ')
  if (object && TABLE_OWNED.has(object) && space !== -1) {
    return (
      <>
        {text.slice(space + 1)}{' '}
        <span className="text-muted-foreground">{text.slice(0, space)}</span>
      </>
    )
  }
  const dot = text.indexOf('.')
  return (
    <>
      <span className="text-muted-foreground">{text.slice(0, dot + 1)}</span>
      {text.slice(dot + 1)}
    </>
  )
}

export const CopyLog = ({ entries }: { entries: CopyLogLine[] }) => {
  const { contentRef, scrollRef } = useStickToBottom({ initial: 'instant' })

  return (
    <div className="bg-input ring-foreground/4 overflow-hidden rounded-xl ring">
      <ScrollArea ref={scrollRef} className="h-56">
        <ol
          ref={contentRef}
          data-mask
          className="py-2 font-mono text-xs leading-4 select-text"
        >
          {entries.map((entry, index) => (
            // The log only grows, so a line keeps its index.
            // oxlint-disable-next-line react/no-array-index-key
            <li key={index} className="flex items-start gap-2.5 px-3 py-1">
              <EntryIcon {...entry} />
              <span
                className={cn(
                  'min-w-0 flex-1 wrap-break-word',
                  entry.kind === 'error' && 'text-destructive'
                )}
              >
                <EntryText {...entry} />
              </span>
              <time className="text-2xs text-muted-foreground/70 mt-px shrink-0 font-sans tabular-nums">
                {formatClockTime(entry.at)}
              </time>
            </li>
          ))}
        </ol>
      </ScrollArea>
    </div>
  )
}
