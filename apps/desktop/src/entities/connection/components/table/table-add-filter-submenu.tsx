import type { ActiveFilter, Filter } from '@conar/shared/filters'
import { FILTER_GROUPS, SQL_FILTERS_GROUPED } from '@conar/shared/filters'
import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@conar/ui/components/context-menu'
import { cn } from '@conar/ui/lib/utils'
import { Fragment } from 'react'
import { toast } from 'sonner'

function cellToFilterString(value: unknown): string {
  if (value === null || value === undefined)
    return ''
  if (typeof value === 'object')
    return JSON.stringify(value)
  return String(value)
}

/** Escape `%`, `_`, `\` for literals inside a SQL LIKE pattern. */
function escapeLikePattern(s: string): string {
  return s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')
}

function quoteSqlPreview(s: string): string {
  return `'${s.replaceAll('\'', '\'\'')}'`
}

function filterPreviewParts(
  columnId: string,
  filter: Filter,
  cellValue: unknown,
): { column: string, operator: string, value: string | null } {
  if (filter.hasValue === false) {
    return {
      column: columnId,
      operator: filter.operator,
      value: null,
    }
  }

  const raw = cellToFilterString(cellValue)

  if (filter.isArray) {
    return {
      column: columnId,
      operator: filter.operator,
      value: raw === '' ? '()' : `(${quoteSqlPreview(raw)})`,
    }
  }

  const op = filter.operator
  if (op === 'LIKE' || op === 'ILIKE' || op === 'NOT LIKE') {
    if (raw === '') {
      return { column: columnId, operator: op, value: `'%'` }
    }
    const escaped = escapeLikePattern(raw).replaceAll('\'', '\'\'')
    return { column: columnId, operator: op, value: `'%${escaped}%'` }
  }

  return {
    column: columnId,
    operator: op,
    value: quoteSqlPreview(raw),
  }
}

function previewTitle(parts: { column: string, operator: string, value: string | null }): string {
  return parts.value == null
    ? `${parts.column} ${parts.operator}`
    : `${parts.column} ${parts.operator} ${parts.value}`
}

function FilterPreviewSegments({
  parts,
}: {
  parts: { column: string, operator: string, value: string | null }
}) {
  const title = previewTitle(parts)

  return (
    <span
      className={`
        flex w-full max-w-full min-w-0 items-center gap-2 font-mono text-xs
      `}
      title={title}
    >
      <span className="shrink-0 font-medium text-primary">
        {parts.column}
      </span>
      <span
        aria-hidden
        className="h-3 w-px shrink-0 bg-border"
      />
      <span className="shrink-0 text-muted-foreground">
        {parts.operator}
      </span>
      {parts.value != null && (
        <>
          <span
            aria-hidden
            className="h-3 w-px shrink-0 bg-border"
          />
          <span className="min-w-0 flex-1 truncate text-foreground">
            {parts.value}
          </span>
        </>
      )}
    </span>
  )
}

function valuesForQuickFilter(filter: Filter, cellValue: unknown): string[] {
  if (filter.hasValue === false)
    return ['']

  const raw = cellToFilterString(cellValue)

  if (filter.isArray)
    return raw === '' ? [''] : [raw]

  const op = filter.operator
  if (op === 'LIKE' || op === 'ILIKE' || op === 'NOT LIKE') {
    if (raw === '')
      return ['%']
    return [`%${escapeLikePattern(raw)}%`]
  }

  return [raw]
}

function isQuickFilterDisabled(filter: Filter, hasRow: boolean, cellValue: unknown): boolean {
  if (filter.hasValue === false)
    return false
  if (!hasRow)
    return true
  return cellValue === null || cellValue === undefined
}

function buildQuickActiveFilter(
  columnId: string,
  filter: Filter,
  cellValue: unknown,
  hasRow: boolean,
): ActiveFilter | null {
  if (isQuickFilterDisabled(filter, hasRow, cellValue))
    return null

  return {
    column: columnId,
    ref: filter,
    values: valuesForQuickFilter(filter, cellValue),
  }
}

export function TableAddFilterSubmenu({
  columnId,
  cellValue,
  hasRow,
  onAdd,
}: {
  columnId: string
  cellValue: unknown
  hasRow: boolean
  onAdd: (filter: ActiveFilter) => void
}) {
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>
        Add filter
      </ContextMenuSubTrigger>
      <ContextMenuSubContent
        className={cn(`
          max-h-[min(70vh,22rem)] max-w-[min(100vw-2rem,32rem)] min-w-[16rem]
          overflow-y-auto
        `)}
      >
        {SQL_FILTERS_GROUPED.map(({ group, filters }, index) => (
          <Fragment key={group}>
            {index > 0 && <ContextMenuSeparator />}
            <ContextMenuGroup>
              <ContextMenuLabel>
                {FILTER_GROUPS[group]}
              </ContextMenuLabel>
              {filters.map((filter) => {
                const disabled = isQuickFilterDisabled(filter, hasRow, cellValue)
                const parts = filterPreviewParts(columnId, filter, cellValue)

                return (
                  <ContextMenuItem
                    key={filter.operator}
                    disabled={disabled}
                    className="min-w-0"
                    onClick={() => {
                      const active = buildQuickActiveFilter(columnId, filter, cellValue, hasRow)
                      if (!active)
                        return
                      onAdd(active)
                      toast.success('Filter added')
                    }}
                  >
                    <FilterPreviewSegments parts={parts} />
                  </ContextMenuItem>
                )
              })}
            </ContextMenuGroup>
          </Fragment>
        ))}
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}
