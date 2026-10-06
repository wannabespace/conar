import { SparklesIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { isDefinedError } from '@orpc/client'
import type { ActiveFilter } from '@tamery/shared/filters'
import { FILTERS_LIST } from '@tamery/shared/filters'
import { CommandItem, CommandShortcut } from '@tamery/ui/components/command'
import { cn } from '@tamery/ui/lib/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { resourceEnumsQueryOptions } from '~/core/queries/enums/list'
import { checkOrUpgrade, usePermissions } from '~/core/user/permissions'
import { orpc } from '~/lib/orpc'
import { plural } from '~/lib/plural'
import { appStore } from '~/store'

import { useTableColumnsContext } from '../../lib/columns'
import { useTablePageStore } from '../../lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const SUMMARY_VISIBLE_MS = 6000

const mapGeneratedFilters = (
  filters: { column: string; operator: string; values: string[] }[]
): ActiveFilter[] =>
  filters.flatMap(({ column, operator, values }) => {
    const ref = FILTERS_LIST.find((f) => f.operator === operator)
    return ref ? [{ column, ref, values }] : []
  })

const generateSummary = (
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
  schema,
  table,
}: {
  schema: string
  table: string
}) => {
  const isOnline = useSubscription(appStore, {
    selector: (state) => state.isOnline,
  })
  const { connectionResource } = useRouteContext()
  const store = useTablePageStore()
  const { columns } = useTableColumnsContext()
  const { data: enums } = useQuery(
    resourceEnumsQueryOptions({ connectionResource })
  )
  const [freeAiUsage, setFreeAiUsage] = useState<{
    remaining: number
    max: number
  } | null>(null)
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
      onError: (error) => {
        if (isDefinedError(error) && error.code === 'FORBIDDEN') {
          setFreeAiUsage(error.data)
        }
      },
      onSuccess: (data) => {
        const hasOrderBy = Object.keys(data.orderBy).length > 0
        store.set(
          (state) =>
            ({
              ...state,
              filters: mapGeneratedFilters(data.filters),
              orderBy: data.orderBy,
              prompt: '',
            }) satisfies typeof state
        )

        if (data.filters.length === 0 && !hasOrderBy) {
          toast.info(
            'No filters or ordering were generated, please try again with a different prompt',
            { id: 'no-filters-or-ordering' }
          )
        }

        setSummary(generateSummary(data.filters, data.orderBy))
        setFreeAiUsage(data.freeAiUsage || null)

        setTimeout(() => {
          document
            .querySelector<HTMLInputElement>('[data-filter-search-input]')
            ?.focus()
        }, 100)
      },
    })
  )

  const context = `
    Filters working with AND operator.
    Table name: ${table}
    Schema name: ${schema}
    Columns: ${JSON.stringify(
      columns.map((col) => ({
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

  const canAsk = isOnline && !isPending && freeAiUsage?.remaining !== 0

  return {
    ask: (prompt: string) => {
      if (prompt && canAsk) {
        generateFilter({ context, prompt })
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
