import {
  CancelCircleIcon,
  FilterIcon,
  Search01Icon,
  SparklesIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { isDefinedError } from '@orpc/client'
import type { ActiveFilter, Filter } from '@tamery/shared/filters'
import {
  FILTER_GROUPS,
  SQL_FILTERS_GROUPED,
  SQL_FILTERS_LIST,
} from '@tamery/shared/filters'
import {
  CommandGroup,
  CommandItem,
  CommandList,
  CommandPrimitive,
  CommandShortcut,
} from '@tamery/ui/components/command'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  EnterIcon,
  KbdCtrlLetter,
} from '@tamery/ui/components/custom/shortcuts'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { resourceEnumsQueryOptions } from '~/entities/connection/queries'
import { orpc } from '~/lib/orpc'
import { appStore } from '~/store'

import { useTableColumnsContext } from '../../-lib/columns'
import { useTablePageStore } from '../../-lib/store'
import { FilterChip } from './filter-chip'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

type Stage =
  | { step: 'idle' }
  | { step: 'operator'; column: string }
  | { step: 'value'; column: string; ref: Filter }

const splitParts = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '')

const operatorMatches = (filter: Filter, text: string) =>
  filter.label.toLowerCase().includes(text) ||
  filter.operator.toLowerCase().includes(text)

const getFilterPlaceholder = ({
  isOnline,
  stage,
}: {
  isOnline: boolean
  stage: Stage
}) => {
  if (stage.step === 'operator') {
    return 'Choose an operator…'
  }
  if (stage.step === 'value') {
    return stage.ref.isArray ? 'Values, comma-separated…' : 'Value…'
  }
  if (!isOnline) {
    return 'Offline — AI unavailable'
  }
  return 'Filter or ask AI…'
}

const firstFilterOperator = SQL_FILTERS_LIST[0]?.operator.toLowerCase() ?? ''

const highlightForStage = (stage: Stage, value: string) => {
  const trimmed = value.trim().toLowerCase()
  if (stage.step === 'operator') {
    const first = SQL_FILTERS_LIST.find((filter) =>
      operatorMatches(filter, trimmed)
    )
    return first ? `operator:${first.operator.toLowerCase()}` : ''
  }
  if (stage.step === 'value') {
    return 'apply-value'
  }
  return trimmed ? `ai:${trimmed}` : ''
}

const handleFilterInputKeyDown = ({
  e,
  filtersLength,
  query,
  setFilters,
  setQuery,
  setStage,
  stage,
}: {
  e: React.KeyboardEvent<HTMLInputElement>
  filtersLength: number
  query: string
  setFilters: (updater: (filters: ActiveFilter[]) => ActiveFilter[]) => void
  setQuery: (value: string) => void
  setStage: (stage: Stage) => void
  stage: Stage
}) => {
  if (e.key === 'Backspace' && query === '') {
    if (stage.step === 'value') {
      setStage({ step: 'operator', column: stage.column })
      return
    }
    if (stage.step === 'operator') {
      setStage({ step: 'idle' })
      return
    }
    if (filtersLength > 0) {
      setFilters((current) => current.slice(0, -1))
    }
    return
  }

  if (e.key !== 'Escape') {
    return
  }

  if (stage.step === 'idle') {
    ;(e.target as HTMLElement).blur()
    return
  }

  e.preventDefault()
  e.stopPropagation()
  setStage({ step: 'idle' })
  setQuery('')
}

const mapGeneratedFilters = (
  filters: { column: string; operator: string; values: string[] }[]
) =>
  filters
    .map(
      (filter) =>
        ({
          column: filter.column,
          ref: SQL_FILTERS_LIST.find((f) => f.operator === filter.operator),
          values: filter.values,
        }) satisfies Omit<ActiveFilter, 'ref'> & {
          ref?: ActiveFilter['ref']
        }
    )
    .filter((f) => !!f.ref) as ActiveFilter[]

const generateSummary = (
  filters: { column: string }[],
  orderBy: Record<string, 'ASC' | 'DESC'>
) => {
  const parts: string[] = []

  if (filters.length > 0) {
    const columns = [...new Set(filters.map((filter) => filter.column))]
    parts.push(
      `${filters.length} filter${filters.length > 1 ? 's' : ''} on ${columns.join(', ')}`
    )
  }

  for (const [column, direction] of Object.entries(orderBy)) {
    parts.push(`sorted by ${column} ${direction.toLowerCase()}`)
  }

  return parts.length > 0 ? `Applied ${parts.join(' · ')}` : null
}

const getStageSuggestions = ({
  columns,
  query,
  stage,
}: {
  columns?: { id: string; availableValues?: string[]; uiType?: string }[]
  query: string
  stage: Stage
}) => {
  const stageColumn =
    stage.step === 'value'
      ? columns?.find((column) => column.id === stage.column)
      : undefined
  const suggestedValues =
    stageColumn?.availableValues ??
    (stageColumn?.uiType === 'boolean' ? ['true', 'false'] : undefined)
  const committedParts =
    stage.step === 'value' && stage.ref.isArray ? splitParts(query) : []
  const valueFilterText = (
    stage.step === 'value' && stage.ref.isArray
      ? (query.split(',').at(-1) ?? '')
      : query
  ).trim()
  const matchingValues = (suggestedValues ?? []).filter((value) =>
    value.toLowerCase().includes(valueFilterText.toLowerCase())
  )

  return { committedParts, matchingValues, valueFilterText }
}

const applyOperatorSelection = ({
  focusSearchInput,
  ref,
  resetStage,
  setFilters,
  setHighlighted,
  setPrompt,
  setStage,
  stage,
}: {
  focusSearchInput: () => void
  ref: Filter
  resetStage: () => void
  setFilters: (updater: (filters: ActiveFilter[]) => ActiveFilter[]) => void
  setHighlighted: (value: string) => void
  setPrompt: (value: string) => void
  setStage: (stage: Stage) => void
  stage: Stage
}) => {
  if (stage.step !== 'operator') {
    return
  }
  if (ref.hasValue === false) {
    setFilters((current) => [
      ...current,
      { column: stage.column, ref, values: [] },
    ])
    resetStage()
  } else {
    setStage({ step: 'value', column: stage.column, ref })
    setHighlighted('apply-value')
    setPrompt('')
  }
  focusSearchInput()
}

const applyFilterValue = ({
  focusSearchInput,
  query,
  resetStage,
  setFilters,
  stage,
}: {
  focusSearchInput: () => void
  query: string
  resetStage: () => void
  setFilters: (updater: (filters: ActiveFilter[]) => ActiveFilter[]) => void
  stage: Stage
}) => {
  if (stage.step !== 'value') {
    return
  }
  const values = stage.ref.isArray ? splitParts(query) : [query]
  setFilters((current) => [
    ...current,
    { column: stage.column, ref: stage.ref, values },
  ])
  resetStage()
  focusSearchInput()
}

const applySuggestedValue = ({
  committedParts,
  focusSearchInput,
  resetStage,
  setFilters,
  setQuery,
  stage,
  value,
  valueFilterText,
}: {
  committedParts: string[]
  focusSearchInput: () => void
  resetStage: () => void
  setFilters: (updater: (filters: ActiveFilter[]) => ActiveFilter[]) => void
  setQuery: (value: string) => void
  stage: Stage
  value: string
  valueFilterText: string
}) => {
  if (stage.step !== 'value') {
    return
  }
  if (stage.ref.isArray) {
    const committed = valueFilterText
      ? committedParts.slice(0, -1)
      : committedParts
    const next = committed.includes(value)
      ? committed.filter((part) => part !== value)
      : [...committed, value]
    setQuery(next.join(', '))
  } else {
    setFilters((current) => [
      ...current,
      { column: stage.column, ref: stage.ref, values: [value] },
    ])
    resetStage()
  }
  focusSearchInput()
}

const FilterCommandList = ({
  applyValue,
  askAi,
  committedParts,
  filtersCount,
  freeAiUsage,
  isOnline,
  isPending,
  matchingColumns,
  matchingOperators,
  matchingValues,
  onClearFilters,
  pickColumn,
  pickOperator,
  pickSuggestedValue,
  query,
  stage,
  trimmedQuery,
}: {
  applyValue: () => void
  askAi: () => void
  committedParts: string[]
  filtersCount: number
  freeAiUsage: { remaining: number; max: number } | null
  isOnline: boolean
  isPending: boolean
  matchingColumns: { id: string; type?: string; typeLabel?: string }[]
  matchingOperators: { group: keyof typeof FILTER_GROUPS; filters: Filter[] }[]
  matchingValues: string[]
  onClearFilters: () => void
  pickColumn: (columnId: string) => void
  pickOperator: (ref: Filter) => void
  pickSuggestedValue: (value: string) => void
  query: string
  stage: Stage
  trimmedQuery: string
}) => (
  <CommandList className="max-h-64">
    {stage.step === 'idle' && (
      <CommandGroup>
        {matchingColumns.map((column) => (
          <CommandItem
            key={column.id}
            value={`column:${column.id}`}
            onSelect={() => pickColumn(column.id)}
          >
            <HugeiconsIcon icon={FilterIcon} strokeWidth={2} />
            <span data-mask className="min-w-0 flex-1 truncate">
              Filter by {column.id}
            </span>
            {column.type && (
              <CommandShortcut>
                {column.typeLabel || column.type}
              </CommandShortcut>
            )}
          </CommandItem>
        ))}
        {trimmedQuery.length > 0 && (
          <CommandItem
            value={`ai:${trimmedQuery.toLowerCase()}`}
            disabled={!isOnline || isPending || freeAiUsage?.remaining === 0}
            onSelect={askAi}
          >
            <HugeiconsIcon
              icon={SparklesIcon}
              strokeWidth={2}
              className="text-primary/75 size-4"
            />
            <span className="min-w-0 flex-1 truncate">
              Ask AI: “{trimmedQuery}”
            </span>
            {freeAiUsage && (
              <CommandShortcut>
                {freeAiUsage.remaining}/{freeAiUsage.max} left
              </CommandShortcut>
            )}
          </CommandItem>
        )}
        {trimmedQuery.length === 0 && filtersCount > 0 && (
          <CommandItem value="clear-filters" onSelect={onClearFilters}>
            <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} />
            Clear all filters
          </CommandItem>
        )}
      </CommandGroup>
    )}
    {stage.step === 'operator' &&
      matchingOperators.map((group) => (
        <CommandGroup key={group.group} heading={FILTER_GROUPS[group.group]}>
          {group.filters.map((filter) => (
            <CommandItem
              key={filter.operator}
              value={`operator:${filter.operator.toLowerCase()}`}
              onSelect={() => pickOperator(filter)}
            >
              <span className="min-w-0 flex-1 truncate">{filter.label}</span>
              <CommandShortcut>{filter.operator}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
    {stage.step === 'value' && (
      <>
        {matchingValues.length > 0 && (
          <CommandGroup heading="Suggested values">
            {matchingValues.map((value) => (
              <CommandItem
                key={value}
                value={`suggest:${value.toLowerCase()}`}
                onSelect={() => pickSuggestedValue(value)}
              >
                <HugeiconsIcon
                  icon={Tick02Icon}
                  strokeWidth={2}
                  className={cn(
                    'size-4',
                    committedParts.includes(value)
                      ? 'text-foreground'
                      : 'opacity-0'
                  )}
                />
                <span data-mask className="min-w-0 flex-1 truncate">
                  {value}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup>
          <CommandItem value="apply-value" onSelect={applyValue}>
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
            <span data-mask className="min-w-0 flex-1 truncate">
              Apply: {stage.column} {stage.ref.operator}{' '}
              {query === '' ? '(empty)' : query}
            </span>
            <CommandShortcut>
              <EnterIcon />
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </>
    )}
  </CommandList>
)

const AiSummaryRow = ({
  hasList,
  summary,
}: {
  hasList: boolean
  summary: string
}) => (
  <motion.div
    initial={{ height: 0, opacity: 0, y: 8 }}
    animate={{ height: 'auto', opacity: 1, y: 0 }}
    exit={{ height: 0, opacity: 0, y: 8 }}
    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
    className="overflow-hidden"
  >
    <div
      data-mask
      className={cn(
        'text-muted-foreground flex items-center gap-2 px-3 py-1.5 text-xs',
        hasList && 'border-b'
      )}
    >
      <HugeiconsIcon
        icon={Tick02Icon}
        strokeWidth={2}
        className="text-success size-3.5 shrink-0"
      />
      <span className="min-w-0 flex-1 truncate">{summary}</span>
    </div>
  </motion.div>
)

export const FilterSearchBar = ({
  table,
  schema,
}: {
  table: string
  schema: string
}) => {
  const isOnline = useSubscription(appStore, {
    selector: (state) => state.isOnline,
  })
  const { connectionResource } = useRouteContext()
  const inputRef = useRef<HTMLInputElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const store = useTablePageStore()
  const filters = useSubscription(store, {
    selector: (state) => state.filters,
  })
  const query = useSubscription(store, { selector: (state) => state.prompt })
  const [isFocused, setIsFocused] = useState(false)
  const [stage, setStage] = useState<Stage>({ step: 'idle' })
  const [highlighted, setHighlighted] = useState('')
  const [freeAiUsage, setFreeAiUsage] = useState<{
    remaining: number
    max: number
  } | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)

  const setPrompt = (value: string) =>
    store.set((state) => ({ ...state, prompt: value }) satisfies typeof state)

  const setQuery = (value: string) => {
    setPrompt(value)
    setHighlighted(highlightForStage(stage, value))
    setAiSummary(null)
  }

  useEffect(() => {
    const chips = chipsRef.current

    if (chips && filters.length > 0) {
      chips.scrollTop = chips.scrollHeight
    }
  }, [filters.length])

  useEffect(() => {
    if (!aiSummary) {
      return
    }

    const timer = setTimeout(() => setAiSummary(null), 6000)

    return () => clearTimeout(timer)
  }, [aiSummary])

  const setFilters = (updater: (filters: ActiveFilter[]) => ActiveFilter[]) =>
    store.set(
      (state) =>
        ({ ...state, filters: updater(state.filters) }) satisfies typeof state
    )

  const resetStage = () => {
    setStage({ step: 'idle' })
    setHighlighted('')
    setPrompt('')
  }

  const { columns } = useTableColumnsContext()
  const { data: enums } = useQuery(
    resourceEnumsQueryOptions({ connectionResource })
  )

  const { mutate: generateFilter, isPending } = useMutation(
    orpc.ai.filters.mutationOptions({
      onSuccess: (data) => {
        const hasOrderBy = Object.keys(data.orderBy).length > 0
        store.set(
          (state) =>
            ({
              ...state,
              prompt: '',
              orderBy: data.orderBy,
              filters: mapGeneratedFilters(data.filters),
            }) satisfies typeof state
        )

        if (data.filters.length === 0 && !hasOrderBy) {
          toast.info(
            'No filters or ordering were generated, please try again with a different prompt',
            { id: 'no-filters-or-ordering' }
          )
        }

        setAiSummary(generateSummary(data.filters, data.orderBy))
        setFreeAiUsage(data.freeAiUsage || null)

        setTimeout(() => {
          document
            .querySelector<HTMLInputElement>('[data-filter-search-input]')
            ?.focus()
        }, 100)
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          setFreeAiUsage(error.data)
        }
      },
    })
  )

  const context = `
    Filters working with AND operator.
    Table name: ${table}
    Schema name: ${schema}
    Columns: ${JSON.stringify(
      columns?.map((col) => ({
        id: col.id,
        type: col.type,
        default: col.defaultValue,
        isNullable: col.isNullable,
      })),
      null,
      2
    )}
    Enums: ${JSON.stringify(enums, null, 2)}
  `.trim()

  useHotkey('Mod+F', () => {
    inputRef.current?.focus()
  })

  const trimmedQuery = query.trim()
  const columnQuery = trimmedQuery.toLowerCase()
  const columnRank = (id: string) => {
    if (id === columnQuery) {
      return 0
    }

    return id.startsWith(columnQuery) ? 1 : 2
  }
  const matchingColumns = (columns ?? [])
    .filter((column) => column.id.toLowerCase().includes(columnQuery))
    .toSorted(
      (a, b) => columnRank(a.id.toLowerCase()) - columnRank(b.id.toLowerCase())
    )

  const isOpen =
    isFocused &&
    (stage.step !== 'idle' ||
      trimmedQuery.length > 0 ||
      (columns?.length ?? 0) > 0)

  const focusSearchInput = () => {
    inputRef.current?.focus()
  }

  const askAi = () => {
    if (
      !trimmedQuery ||
      !isOnline ||
      isPending ||
      freeAiUsage?.remaining === 0
    ) {
      return
    }
    generateFilter({ prompt: trimmedQuery, context })
  }

  const pickColumn = (columnId: string) => {
    setStage({ step: 'operator', column: columnId })
    setPrompt('')
    setHighlighted(`operator:${firstFilterOperator}`)
    focusSearchInput()
  }

  const pickOperator = (ref: Filter) => {
    applyOperatorSelection({
      focusSearchInput,
      ref,
      resetStage,
      setFilters,
      setHighlighted,
      setPrompt,
      setStage,
      stage,
    })
  }

  const applyValue = () => {
    applyFilterValue({
      focusSearchInput,
      query,
      resetStage,
      setFilters,
      stage,
    })
  }

  const stageSuggestions = getStageSuggestions({ columns, query, stage })
  const { committedParts, matchingValues } = stageSuggestions

  const pickSuggestedValue = (value: string) => {
    applySuggestedValue({
      committedParts,
      focusSearchInput,
      resetStage,
      setFilters,
      setQuery,
      stage,
      value,
      valueFilterText: stageSuggestions.valueFilterText,
    })
  }

  const matchingOperators = SQL_FILTERS_GROUPED.map((group) => ({
    ...group,
    filters: group.filters.filter((filter) =>
      operatorMatches(filter, trimmedQuery.toLowerCase())
    ),
  })).filter((group) => group.filters.length > 0)

  const placeholder = getFilterPlaceholder({ isOnline, stage })

  return (
    <CommandPrimitive
      shouldFilter={false}
      loop
      value={highlighted}
      onValueChange={setHighlighted}
      className="relative min-w-0 flex-1"
    >
      <div className="bg-input ring-foreground/4 has-[input:focus]:border-ring has-[input:focus]:ring-ring/30 flex min-h-8 w-full items-center gap-1 rounded-xl border border-transparent py-0.75 pr-1.5 pl-2 shadow-xs ring-[0.5px] transition-[color,box-shadow] duration-200 has-[input:focus]:ring-3">
        <LoadingContent
          className="text-muted-foreground pointer-events-none mr-1 size-4 shrink-0"
          loading={isPending}
        >
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="size-4"
          />
        </LoadingContent>
        <div
          ref={chipsRef}
          className="scroll-fade no-scrollbar flex max-h-32 min-w-0 flex-1 flex-wrap items-center gap-1 overflow-y-auto"
        >
          {filters.map((filter, index) => (
            <FilterChip
              // oxlint-disable-next-line react/no-array-index-key
              key={`${filter.column}-${filter.ref.operator}-${filter.values.join(',')}-${index}`}
              filter={filter}
              onRemove={() =>
                setFilters((current) => current.filter((_, i) => i !== index))
              }
              onEdit={(next) =>
                setFilters((current) =>
                  current.map((f, i) => (i === index ? { ...f, ...next } : f))
                )
              }
              onToggleDisabled={() =>
                setFilters((current) =>
                  current.map((f, i) =>
                    i === index ? { ...f, disabled: !f.disabled } : f
                  )
                )
              }
            />
          ))}
          {stage.step !== 'idle' && (
            <span className="ring-foreground/4 flex h-5 shrink-0 items-stretch overflow-hidden rounded-md bg-[color-mix(in_oklch,var(--input),var(--foreground)_4%)] shadow-2xs ring-[0.5px]">
              <span
                data-mask
                className="flex items-center px-1.5 text-xs font-medium"
              >
                {stage.column}
              </span>
              {stage.step === 'value' && (
                <>
                  <span aria-hidden className="bg-border w-px shrink-0" />
                  <span className="text-muted-foreground flex items-center px-1.5 text-xs">
                    {stage.ref.operator}
                  </span>
                </>
              )}
            </span>
          )}
          <CommandPrimitive.Input
            ref={inputRef}
            data-filter-search-input=""
            value={query}
            onValueChange={setQuery}
            placeholder={placeholder}
            disabled={isPending}
            className="placeholder:text-muted-foreground h-6 min-w-32 flex-1 bg-transparent text-sm outline-none"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              handleFilterInputKeyDown({
                e,
                filtersLength: filters.length,
                query,
                setFilters,
                setQuery,
                setStage,
                stage,
              })
            }
          />
        </div>
        <KbdCtrlLetter
          userAgent={navigator.userAgent}
          letter="F"
          className={cn(
            'transition-opacity duration-150',
            isFocused && 'opacity-0'
          )}
        />
      </div>
      <AnimatePresence>
        {(isOpen || aiSummary) && (
          <motion.div
            key="suggestion-panel"
            role="presentation"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="bg-popover ring-foreground/4 absolute bottom-full left-0 z-30 mb-2 w-full overflow-hidden rounded-xl shadow-lg ring-1"
            onMouseDown={(e) => e.preventDefault()}
          >
            <AnimatePresence>
              {aiSummary && (
                <AiSummaryRow hasList={isOpen} summary={aiSummary} />
              )}
            </AnimatePresence>
            {isOpen && (
              <FilterCommandList
                applyValue={applyValue}
                askAi={askAi}
                committedParts={committedParts}
                filtersCount={filters.length}
                freeAiUsage={freeAiUsage}
                isOnline={isOnline}
                isPending={isPending}
                matchingColumns={matchingColumns}
                matchingOperators={matchingOperators}
                matchingValues={matchingValues}
                onClearFilters={() => setFilters(() => [])}
                pickColumn={pickColumn}
                pickOperator={pickOperator}
                pickSuggestedValue={pickSuggestedValue}
                query={query}
                stage={stage}
                trimmedQuery={trimmedQuery}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </CommandPrimitive>
  )
}
