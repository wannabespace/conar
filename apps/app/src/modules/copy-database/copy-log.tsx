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

import type { CopyLogEntry, CopyLogLine } from './copy-log-line'

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
