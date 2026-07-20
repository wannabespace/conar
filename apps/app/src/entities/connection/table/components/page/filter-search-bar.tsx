import { isDefinedError } from '@orpc/client'
import {
  RiBardLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiFilterLine,
  RiSearchLine,
} from '@remixicon/react'
import type { ActiveFilter, Filter } from '@tamery/shared/filters'
import { FILTER_GROUPS, SQL_FILTERS_GROUPED, SQL_FILTERS_LIST } from '@tamery/shared/filters'
import {
  CommandGroup,
  CommandItem,
  CommandList,
  CommandPrimitive,
  CommandShortcut,
} from '@tamery/ui/components/command'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { resourceEnumsQueryOptions } from '~/entities/connection/queries'
import { orpc } from '~/lib/orpc'
import { appStore } from '~/store'

import { useTableColumns } from '../../columns'
import { useTablePageStore } from '../../store'
import { FilterChip } from './filter-chip'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

// Guided add-filter flow: pick a column, then an operator, then type a value
type Stage =
  | { step: 'idle' }
  | { step: 'operator'; column: string }
  | { step: 'value'; column: string; ref: Filter }

// Unified filter field: chips live inline in an input-styled container; typing
// suggests column filters or sends the text to AI. Backspace on an empty input
// removes the last chip.
export function FilterSearchBar({ table, schema }: { table: string; schema: string }) {
  const isOnline = useSubscription(appStore, { selector: state => state.isOnline })
  const { connectionResource } = useRouteContext()
  const inputRef = useRef<HTMLInputElement>(null)
  const store = useTablePageStore()
  const filters = useSubscription(store, { selector: state => state.filters })
  const query = useSubscription(store, { selector: state => state.prompt })
  const [isFocused, setIsFocused] = useState(false)
  const [stage, setStage] = useState<Stage>({ step: 'idle' })
  // cmdk keeps its highlight by item value; when the stage swaps the whole item
  // list the old value no longer exists and nothing is highlighted — so we
  // control it and point it at the first item on every transition
  const [highlighted, setHighlighted] = useState('')
  const [freeAiUsage, setFreeAiUsage] = useState<{
    remaining: number
    max: number
  } | null>(null)

  const setQuery = (value: string) => {
    store.set(state => ({ ...state, prompt: value }) satisfies typeof state)

    const trimmed = value.trim().toLowerCase()
    if (stage.step === 'operator') {
      const first = SQL_FILTERS_LIST.find(
        filter =>
          filter.label.toLowerCase().includes(trimmed) ||
          filter.operator.toLowerCase().includes(trimmed),
      )
      setHighlighted(first ? `operator:${first.operator.toLowerCase()}` : '')
    } else if (stage.step === 'value') {
      setHighlighted('apply-value')
    } else {
      setHighlighted(trimmed ? `ai:${trimmed}` : '')
    }
  }

  const setFilters = (updater: (filters: ActiveFilter[]) => ActiveFilter[]) =>
    store.set(state => ({ ...state, filters: updater(state.filters) }) satisfies typeof state)

  const columns = useTableColumns()
  const { data: enums } = useQuery(resourceEnumsQueryOptions({ connectionResource }))

  const { mutate: generateFilter, isPending } = useMutation(
    orpc.ai.filters.mutationOptions({
      onSuccess: data => {
        const hasOrderBy = Object.keys(data.orderBy).length > 0
        store.set(
          state =>
            ({
              ...state,
              prompt: '',
              orderBy: data.orderBy,
              filters: data.filters
                .map(
                  filter =>
                    ({
                      column: filter.column,
                      ref: SQL_FILTERS_LIST.find(f => f.operator === filter.operator),
                      values: filter.values,
                    }) satisfies Omit<ActiveFilter, 'ref'> & { ref?: ActiveFilter['ref'] },
                )
                // For future updates if we'll have new filters
                .filter(f => !!f.ref) as ActiveFilter[],
            }) satisfies typeof state,
        )

        if (data.filters.length === 0 && !hasOrderBy) {
          toast.info(
            'No filters or ordering were generated, please try again with a different prompt',
            { id: 'no-filters-or-ordering' },
          )
        }

        setFreeAiUsage(data.freeAiUsage || null)

        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      },
      onError: error => {
        if (isDefinedError(error)) {
          setFreeAiUsage(error.data)
        }
      },
    }),
  )

  const context = `
    Filters working with AND operator.
    Table name: ${table}
    Schema name: ${schema}
    Columns: ${JSON.stringify(
      columns?.map(col => ({
        id: col.id,
        type: col.type,
        default: col.defaultValue,
        isNullable: col.isNullable,
      })),
      null,
      2,
    )}
    Enums: ${JSON.stringify(enums, null, 2)}
  `.trim()

  useHotkey('Mod+F', () => {
    inputRef.current?.focus()
  })

  const trimmedQuery = query.trim()
  const matchingColumns = (columns ?? [])
    .filter(column => column.id.toLowerCase().includes(trimmedQuery.toLowerCase()))
    .slice(0, 6)

  const isOpen =
    isFocused && (stage.step !== 'idle' || trimmedQuery.length > 0 || (columns?.length ?? 0) > 0)

  const askAi = () => {
    if (!trimmedQuery || !isOnline || isPending) return
    generateFilter({ prompt: trimmedQuery, context })
  }

  const pickColumn = (columnId: string) => {
    setStage({ step: 'operator', column: columnId })
    store.set(state => ({ ...state, prompt: '' }) satisfies typeof state)
    setHighlighted(`operator:${SQL_FILTERS_LIST[0]!.operator.toLowerCase()}`)
    inputRef.current?.focus()
  }

  const pickOperator = (ref: Filter) => {
    if (stage.step !== 'operator') return
    if (ref.hasValue === false) {
      setFilters(current => [...current, { column: stage.column, ref, values: [] }])
      setStage({ step: 'idle' })
      setHighlighted('')
    } else {
      setStage({ step: 'value', column: stage.column, ref })
      setHighlighted('apply-value')
    }
    store.set(state => ({ ...state, prompt: '' }) satisfies typeof state)
    inputRef.current?.focus()
  }

  const applyValue = () => {
    if (stage.step !== 'value') return
    const values = stage.ref.isArray
      ? query
          .split(',')
          .map(value => value.trim())
          .filter(value => value !== '')
      : [query]
    setFilters(current => [...current, { column: stage.column, ref: stage.ref, values }])
    setStage({ step: 'idle' })
    setHighlighted('')
    store.set(state => ({ ...state, prompt: '' }) satisfies typeof state)
    inputRef.current?.focus()
  }

  const matchingOperators = SQL_FILTERS_GROUPED.map(group => ({
    ...group,
    filters: group.filters.filter(
      filter =>
        filter.label.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
        filter.operator.toLowerCase().includes(trimmedQuery.toLowerCase()),
    ),
  })).filter(group => group.filters.length > 0)

  const placeholder =
    stage.step === 'operator'
      ? 'Choose an operator…'
      : stage.step === 'value'
        ? stage.ref.isArray
          ? 'Values, comma-separated…'
          : 'Value…'
        : isOnline
          ? filters.length > 0
            ? 'Filter or ask AI…'
            : 'Search, filter, or ask AI…'
          : 'Offline — AI unavailable'

  return (
    <CommandPrimitive
      shouldFilter={false}
      loop
      value={highlighted}
      onValueChange={setHighlighted}
      className="relative min-w-0 flex-1"
    >
      <div
        className="
          flex min-h-8 w-full flex-wrap items-center gap-1 rounded-xl border
          bg-input py-1 pr-1.5 pl-2
          transition-[color,box-shadow] duration-200
          has-[input:focus]:border-ring has-[input:focus]:ring-3
          has-[input:focus]:ring-ring/30
        "
      >
        <LoadingContent
          className="pointer-events-none size-4 shrink-0 text-muted-foreground"
          loading={isPending}
        >
          <RiSearchLine className="size-4" />
        </LoadingContent>
        {filters.map((filter, index) => (
          <FilterChip
            // oxlint-disable-next-line react/no-array-index-key
            key={`${filter.column}-${filter.ref.operator}-${filter.values.join(',')}-${index}`}
            filter={filter}
            onRemove={() => setFilters(current => current.filter((_, i) => i !== index))}
            onEdit={next =>
              setFilters(current => current.map((f, i) => (i === index ? { ...f, ...next } : f)))
            }
            onToggleDisabled={() =>
              setFilters(current =>
                current.map((f, i) => (i === index ? { ...f, disabled: !f.disabled } : f)),
              )
            }
          />
        ))}
        {stage.step !== 'idle' && (
          <span
            className="
              flex h-6 shrink-0 items-stretch overflow-hidden rounded-md border
              bg-background shadow-2xs
            "
          >
            <span data-mask className="flex items-center px-1.5 text-xs font-medium">
              {stage.column}
            </span>
            {stage.step === 'value' && (
              <>
                <span aria-hidden className="w-px shrink-0 bg-border" />
                <span className="flex items-center px-1.5 text-xs text-muted-foreground">
                  {stage.ref.operator}
                </span>
              </>
            )}
          </span>
        )}
        <CommandPrimitive.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder={placeholder}
          disabled={isPending || freeAiUsage?.remaining === 0}
          className="
            h-6 min-w-32 flex-1 bg-transparent text-sm outline-none
            placeholder:text-muted-foreground
          "
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            setStage({ step: 'idle' })
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Backspace' && query === '') {
              if (stage.step === 'value') {
                setStage({ step: 'operator', column: stage.column })
              } else if (stage.step === 'operator') {
                setStage({ step: 'idle' })
              } else if (filters.length > 0) {
                setFilters(current => current.slice(0, -1))
              }
            }
            if (e.key === 'Escape') {
              if (stage.step !== 'idle') {
                e.preventDefault()
                e.stopPropagation()
                setStage({ step: 'idle' })
                setQuery('')
              } else {
                ;(e.target as HTMLElement).blur()
              }
            }
          }}
        />
        <KbdCtrlLetter
          userAgent={navigator.userAgent}
          letter="F"
          className={cn('transition-opacity duration-150', isFocused && 'opacity-0')}
        />
      </div>
      {isOpen && (
        <div
          role="presentation"
          className="
            absolute bottom-full left-0 z-30 mb-2 w-full overflow-hidden
            rounded-2xl border bg-popover p-1 shadow-lg
          "
          // Keep the input focused while clicking suggestions
          onMouseDown={e => e.preventDefault()}
        >
          <CommandList className="max-h-64">
            {stage.step === 'idle' && (
              <CommandGroup>
                {trimmedQuery.length > 0 && (
                  <CommandItem
                    value={`ai:${trimmedQuery.toLowerCase()}`}
                    disabled={!isOnline || isPending || freeAiUsage?.remaining === 0}
                    onSelect={askAi}
                  >
                    <RiBardLine className="size-4 text-primary/75" />
                    <span className="min-w-0 flex-1 truncate">Ask AI: “{trimmedQuery}”</span>
                    {freeAiUsage && (
                      <CommandShortcut className="tracking-normal">
                        {freeAiUsage.remaining}/{freeAiUsage.max} left
                      </CommandShortcut>
                    )}
                  </CommandItem>
                )}
                {matchingColumns.map(column => (
                  <CommandItem
                    key={column.id}
                    value={`column:${column.id}`}
                    onSelect={() => pickColumn(column.id)}
                  >
                    <RiFilterLine className="size-4 text-muted-foreground" />
                    <span data-mask className="min-w-0 flex-1 truncate">
                      Filter by {column.id}
                    </span>
                    {column.type && (
                      <CommandShortcut className="tracking-normal">{column.type}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
                {trimmedQuery.length === 0 && filters.length > 0 && (
                  <CommandItem value="clear-filters" onSelect={() => setFilters(() => [])}>
                    <RiCloseCircleLine className="size-4 text-muted-foreground" />
                    Clear all filters
                  </CommandItem>
                )}
              </CommandGroup>
            )}
            {stage.step === 'operator' &&
              matchingOperators.map(group => (
                <CommandGroup key={group.group} heading={FILTER_GROUPS[group.group]}>
                  {group.filters.map(filter => (
                    <CommandItem
                      key={filter.operator}
                      value={`operator:${filter.operator.toLowerCase()}`}
                      onSelect={() => pickOperator(filter)}
                    >
                      <span className="min-w-0 flex-1 truncate">{filter.label}</span>
                      <CommandShortcut className="tracking-normal">
                        {filter.operator}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            {stage.step === 'value' && (
              <CommandGroup>
                <CommandItem value="apply-value" onSelect={applyValue}>
                  <RiCheckLine className="size-4 text-muted-foreground" />
                  <span data-mask className="min-w-0 flex-1 truncate">
                    Apply: {stage.column} {stage.ref.operator} {query === '' ? '(empty)' : query}
                  </span>
                  <CommandShortcut>↵</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </div>
      )}
    </CommandPrimitive>
  )
}
