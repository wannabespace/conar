import { SparklesIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { CommandItem, CommandShortcut } from '@tamery/ui/components/command'
import { cn } from '@tamery/ui/lib/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { RefObject } from 'react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { resourceEnumsQueryOptions } from '~/core/queries/enums/list'
import { checkOrUpgrade, usePermissions } from '~/core/user/permissions'
import { usageQueryOptions } from '~/core/user/usage'
import { orpc } from '~/lib/orpc'
import { queryClient } from '~/lib/query-client'
import { useIsOnline } from '~/store'
import { plural } from '~/utils/plural'

import { useTableColumnsContext } from '../../lib/columns'
import { useTablePageStore } from '../../lib/store'
import { offeredFilters } from './filter-composer'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const SUMMARY_VISIBLE_MS = 6000

const summarize = (
  filters: { column: string }[],
  orderBy: Record<string, 'ASC' | 'DESC'>
) => {
  const parts: string[] = []

  if (filters.length > 0) {
    const columns = [...new Set(filters.map((filter) => filter.column))]
    parts.push(`${plural(filters.length, 'filter')} on ${columns.join(', ')}`)
  }

  for (const [column, direction] of Object.entries(orderBy)) {
    parts.push(`sorted by ${column} ${direction.toLowerCase()}`)
  }

  return parts.length > 0 ? `Applied ${parts.join(' · ')}` : null
}

export type FilterAi = ReturnType<typeof useFilterAi>

export const useFilterAi = ({
  inputRef,
  schema,
  table,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  schema: string
  table: string
}) => {
  const isOnline = useIsOnline()
  const { connection, connectionResource } = useRouteContext()
  const store = useTablePageStore()
  const { columns } = useTableColumnsContext()
  const { data: enums } = useQuery(
    resourceEnumsQueryOptions({ connectionResource })
  )
  const { check } = usePermissions()
  const { data: usage } = useQuery({
    ...usageQueryOptions,
    enabled: check('ai.filter.use') && !check('ai.filter.unlimited'),
  })
  const freeAiUsage = usage?.filters && {
    max: usage.filters.max,
    remaining: Math.max(0, usage.filters.max - usage.filters.used),
  }
  const [summary, setSummary] = useState<string | null>(null)

  useEffect(() => {
    if (!summary) {
      return
    }

    const timer = setTimeout(() => setSummary(null), SUMMARY_VISIBLE_MS)

    return () => clearTimeout(timer)
  }, [summary])

  const { mutate: generateFilter, isPending } = useMutation(
    orpc.ai.filters.mutationOptions({
      meta: { event: 'ai_filter_generated' },
      onSettled: () => queryClient.invalidateQueries(usageQueryOptions),
      onSuccess: (data) => {
        const known = new Set(columns.map((column) => column.id))
        const offered = offeredFilters(connection.type).flatMap(
          (group) => group.filters
        )
        const filters = data.filters.flatMap(({ column, operator, values }) => {
          const ref = offered.find((filter) => filter.operator === operator)
          return ref && known.has(column) ? [{ column, ref, values }] : []
        })
        const orderBy = Object.fromEntries(
          Object.entries(data.orderBy).filter(([column]) => known.has(column))
        )

        if (filters.length === 0 && Object.keys(orderBy).length === 0) {
          toast.info(
            'No filters or ordering were generated, please try again with a different prompt',
            { id: 'no-filters-or-ordering' }
          )
          return
        }

        store.set(
          (state) =>
            ({ ...state, filters, orderBy, prompt: '' }) satisfies typeof state
        )
        setSummary(summarize(filters, orderBy))
      },
    })
  )

  const canAsk = isOnline && !isPending && freeAiUsage?.remaining !== 0

  return {
    ask: (prompt: string) => {
      if (prompt && canAsk) {
        const current = store.get()
        const context = `
          Filters working with AND operator.
          Database engine: ${connection.type}${capabilitiesOf(connection.type).ilike ? '' : ' (no ilike operator: use like)'}
          Current filters: ${JSON.stringify(
            current.filters.map(({ column, ref, values }) => ({
              column,
              operator: ref.operator,
              values,
            }))
          )}
          Current ordering: ${JSON.stringify(current.orderBy)}
          Table name: ${table}
          Schema name: ${schema}
          Columns: ${JSON.stringify(
            columns.map((col) => ({
              comment: col.comment ?? undefined,
              default: col.defaultValue,
              id: col.id,
              isNullable: col.isNullable,
              type: col.type,
            })),
            null,
            2
          )}
          Enums: ${JSON.stringify(enums, null, 2)}
        `.trim()
        generateFilter(
          { context, prompt },
          {
            // The input stays disabled until the pending state re-renders away.
            onSuccess: () => setTimeout(() => inputRef.current?.focus(), 100),
          }
        )
      }
    },
    canAsk,
    dismiss: () => setSummary(null),
    freeAiUsage,
    isOnline,
    isPending,
    summary,
  }
}

export const FilterAskAiItem = ({
  ai,
  prompt,
}: {
  ai: FilterAi
  prompt: string
}) => {
  const aiLocked = !usePermissions().check('ai.filter.use')

  return (
    <CommandItem
      value={`ai:${prompt.toLowerCase()}`}
      disabled={!ai.canAsk}
      className={aiLocked ? 'opacity-50' : undefined}
      onSelect={() => checkOrUpgrade('ai.filter.use') && ai.ask(prompt)}
    >
      <HugeiconsIcon
        icon={SparklesIcon}
        strokeWidth={2}
        className="text-primary/75 size-4"
      />
      <span className="min-w-0 flex-1 truncate">Ask AI: “{prompt}”</span>
      {ai.freeAiUsage && (
        <CommandShortcut>
          {ai.freeAiUsage.remaining}/{ai.freeAiUsage.max} left
        </CommandShortcut>
      )}
    </CommandItem>
  )
}

export const AiSummaryRow = ({
  hasList,
  summary,
}: {
  hasList: boolean
  summary: string
}) => (
  <motion.div
    initial={{ height: 0, opacity: 0, y: -8 }}
    animate={{ height: 'auto', opacity: 1, y: 0 }}
    exit={{ height: 0, opacity: 0, y: -8 }}
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
