import type { ToolUIPart } from 'ai'

export type ToolType
  = | 'tool-columns'
    | 'tool-enums'
    | 'tool-select'
    | 'tool-webSearch'
    | 'tool-resolveLibrary'
    | 'tool-getLibraryDocs'
    | (string & {})

export type ToolInput = Record<string, unknown> | unknown
export type ToolOutput = Record<string, unknown> | unknown[] | unknown

export type ToolPart = Omit<ToolUIPart, 'type' | 'input' | 'output'> & {
  type: ToolType
  input?: ToolInput
  output?: ToolOutput
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object')
    return false
  if (Array.isArray(value))
    return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

export function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key]
  return typeof v === 'string' ? v : undefined
}

function readErrorField(value: unknown): unknown | undefined {
  if (!isRecord(value))
    return undefined
  return (value as { error?: unknown }).error
}

export function jsonStringifySafe(value: unknown) {
  const seen = new WeakSet<object>()
  try {
    return JSON.stringify(
      value,
      (_key, val: unknown) => {
        if (typeof val === 'bigint')
          return val.toString()

        if (typeof val === 'object' && val !== null) {
          const obj = val as object
          if (seen.has(obj))
            return '[Circular]'
          seen.add(obj)
        }

        return val
      },
      2,
    )
  }
  catch {
    try {
      return String(value)
    }
    catch {
      return '[Unserializable]'
    }
  }
}

function truncateOneLine(s: string, max = 180) {
  const one = s.replace(/\s+/g, ' ').trim()
  if (one.length <= max)
    return one
  return `${one.slice(0, max)}…`
}

const preferredSummaryKeys = [
  'query',
  'libraryId',
  'topic',
  'url',
  'name',
  'title',
  'id',
  'status',
  'content',
  'text',
  'message',
  'result',
  'answer',
  'summary',
] as const

export function summarize(value: unknown): string | null {
  if (value === undefined || value === null)
    return null
  if (typeof value === 'string')
    return truncateOneLine(value)
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
    return String(value)
  if (Array.isArray(value))
    return `${value.length} item${value.length === 1 ? '' : 's'}`
  if (isRecord(value)) {
    const keys = Object.keys(value)
    if (keys.length === 0)
      return 'Empty object'

    for (const k of preferredSummaryKeys) {
      const v = value[k]
      if (typeof v === 'string')
        return `${k}: ${truncateOneLine(v)}`
      if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint')
        return `${k}: ${String(v)}`
    }

    if (keys.length <= 4)
      return `Fields: ${keys.join(', ')}`
    return `${keys.length} fields: ${keys.slice(0, 3).join(', ')}…`
  }
  return truncateOneLine(String(value))
}

interface TableAndSchema { schemaName?: string, tableName?: string }

interface SelectWhereFilter {
  column: string
  operator: string
  values: string[]
}

interface SelectInput {
  select?: string[]
  tableAndSchema?: TableAndSchema
  whereFilters?: SelectWhereFilter[]
  whereConcatOperator?: string
  orderBy?: Record<string, string>
  limit?: number
  offset?: number
}

function parseTableAndSchema(value: unknown): TableAndSchema | undefined {
  if (!isRecord(value))
    return undefined
  return {
    schemaName: readString(value, 'schemaName'),
    tableName: readString(value, 'tableName'),
  }
}

function parseSelectInput(value: unknown): SelectInput | null {
  if (!isRecord(value))
    return null

  const selectRaw = value.select
  const select = Array.isArray(selectRaw) && selectRaw.every(v => typeof v === 'string')
    ? selectRaw
    : undefined

  const whereFiltersRaw = value.whereFilters
  const whereFilters: SelectWhereFilter[] | undefined = Array.isArray(whereFiltersRaw)
    ? whereFiltersRaw
        .map((f): SelectWhereFilter | null => {
          if (!isRecord(f))
            return null
          const column = readString(f, 'column')
          const operator = readString(f, 'operator')
          const valuesRaw = f.values
          const values = Array.isArray(valuesRaw) && valuesRaw.every(v => typeof v === 'string')
            ? valuesRaw
            : null
          if (!column || !operator || !values)
            return null
          return { column, operator, values }
        })
        .filter((x): x is SelectWhereFilter => x !== null)
    : undefined

  const orderByRaw = value.orderBy
  const orderBy: Record<string, string> | undefined = isRecord(orderByRaw)
    ? Object.fromEntries(Object.entries(orderByRaw).flatMap(([k, v]) => (typeof v === 'string' ? [[k, v]] : [])))
    : undefined

  return {
    select,
    tableAndSchema: parseTableAndSchema(value.tableAndSchema),
    whereFilters,
    whereConcatOperator: readString(value, 'whereConcatOperator'),
    orderBy,
    limit: typeof value.limit === 'number' ? value.limit : undefined,
    offset: typeof value.offset === 'number' ? value.offset : undefined,
  }
}

function formatSchemaPrefix(schemaName?: string) {
  if (!schemaName || schemaName === 'public')
    return ''
  return `"${schemaName}".`
}

function formatTableRef(tableAndSchema?: TableAndSchema) {
  const schema = formatSchemaPrefix(tableAndSchema?.schemaName)
  const table = tableAndSchema?.tableName ? `"${tableAndSchema.tableName}"` : '...'
  return `${schema}${table}`
}

export function toolTitle(tool: ToolPart): string {
  const t = tool.type?.toString?.() ?? 'tool'
  return t.startsWith('tool-') ? t.slice(5) : t
}

export function stateTooltip(state: ToolUIPart['state']) {
  const labels: Partial<Record<ToolUIPart['state'], string>> = {
    'input-streaming': 'Running…',
    'input-available': 'Running…',
    'output-available': 'Completed',
    'output-error': 'Failed',
  }
  return labels[state] ?? 'Working…'
}

export function headerText(tool: ToolPart): string {
  const title = toolTitle(tool)
  if (tool.state === 'output-error')
    return `Failed ${title}`
  if (tool.state === 'output-available')
    return `Ran ${title}`
  return `Running ${title}`
}

export function primaryLabel(tool: ToolPart): string {
  if (tool.type === 'tool-columns') {
    const tableAndSchemaRaw = isRecord(tool.input)
      ? (tool.input as Record<string, unknown>).tableAndSchema
      : undefined
    const input = parseTableAndSchema(tableAndSchemaRaw)
    return `Columns ${formatTableRef(input)}`
  }
  if (tool.type === 'tool-select') {
    const input = parseSelectInput(tool.input)
    return `Select ${formatTableRef(input?.tableAndSchema)}`
  }
  if (tool.type === 'tool-webSearch') {
    const q = isRecord(tool.input) ? readString(tool.input, 'query') : undefined
    return q ? `Web: ${q}` : 'Web search'
  }
  if (tool.type === 'tool-resolveLibrary') {
    const name = isRecord(tool.input) ? readString(tool.input, 'libraryName') : undefined
    return name ? `Resolve: ${name}` : 'Resolve library'
  }
  if (tool.type === 'tool-getLibraryDocs') {
    const id = isRecord(tool.input) ? readString(tool.input, 'libraryId') : undefined
    const topic = isRecord(tool.input) ? readString(tool.input, 'topic') : undefined
    if (!id)
      return 'Docs'
    return topic ? `Docs: ${id} · ${topic}` : `Docs: ${id}`
  }
  if (tool.type === 'tool-enums')
    return 'Enums'
  return toolTitle(tool)
}

export function getErrorText(tool: ToolPart): string | null {
  if (tool.state !== 'output-error')
    return null
  const error = readErrorField(tool.output)
  return error ? String(error) : null
}

export function getToolStableKey(tool: ToolPart): string {
  if (isRecord(tool)) {
    const toolCallId = readString(tool as unknown as Record<string, unknown>, 'toolCallId')
    if (toolCallId)
      return toolCallId
    const id = readString(tool as unknown as Record<string, unknown>, 'id')
    if (id)
      return id
  }

  if (isRecord(tool.input)) {
    const inputId = readString(tool.input, 'id') ?? readString(tool.input, 'name') ?? readString(tool.input, 'table')
    if (inputId)
      return `${tool.type}:${inputId}`
  }

  const sig = jsonStringifySafe(tool.input)
  return `${tool.type}:${sig.slice(0, 200)}`
}
