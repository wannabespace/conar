export interface CopyLogEntry {
  kind: 'step' | 'error' | 'warning' | 'detail' | 'info'
  /** pg_dump's name for the object a step creates, or `TABLE DATA` for copied rows. */
  object: string | null
  text: string
}

export type CopyLogLine = CopyLogEntry & { at: Date }

const CREATED = /^pg_dump: creating (?<object>.+?) "(?<name>.+)"$/u
const COPIED = /^pg_dump: dumping contents of table "(?<name>.+)"$/u
const TOOL_PROBLEM = /^(?:pg_dump|psql): (?<kind>error|warning): (?<text>.*)$/u
const SERVER_MESSAGE =
  /^(?:psql:[^:]*:\d+: )?(?<kind>ERROR|FATAL|WARNING|DETAIL|NOTICE|HINT):\s+(?<text>.*)$/u
const SERVER_KINDS: Record<string, CopyLogEntry['kind']> = {
  DETAIL: 'detail',
  ERROR: 'error',
  FATAL: 'error',
  WARNING: 'warning',
}
const HIDDEN_OBJECTS = new Set([
  'COMMENT',
  'DEFAULT',
  'SEQUENCE OWNED BY',
  'TABLE ATTACH',
])

export const parseCopyLogLine = (line: string): CopyLogEntry | null => {
  const problem = TOOL_PROBLEM.exec(line)?.groups
  if (problem) {
    return {
      kind: problem.kind === 'error' ? 'error' : 'warning',
      object: null,
      text: problem.text ?? '',
    }
  }
  const created = CREATED.exec(line)?.groups
  if (created) {
    return HIDDEN_OBJECTS.has(created.object ?? '')
      ? null
      : {
          kind: 'step',
          object: created.object ?? null,
          text: created.name ?? '',
        }
  }
  const copied = COPIED.exec(line)?.groups
  if (copied) {
    return { kind: 'step', object: 'TABLE DATA', text: copied.name ?? '' }
  }
  if (line.startsWith('pg_dump: ')) {
    return null
  }
  const message = SERVER_MESSAGE.exec(line)?.groups
  if (message) {
    const kind = SERVER_KINDS[message.kind ?? '']
    return kind ? { kind, object: null, text: message.text ?? '' } : null
  }
  return { kind: 'info', object: null, text: line }
}

/** A failure reaches the log twice, as the tool's own lines and as the copy's error, in either order, so a problem already shown is not repeated. */
export const appendCopyLog = (
  previous: CopyLogLine[],
  next: CopyLogEntry[]
): CopyLogLine[] => [
  ...previous,
  ...next
    .filter(
      (entry) =>
        (entry.kind !== 'error' && entry.kind !== 'detail') ||
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
