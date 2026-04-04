import type { ActiveFilter } from '@conar/shared/filters'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { KbdCtrlLetter } from '@conar/ui/components/custom/shortcuts'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@conar/ui/components/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import NumberFlow from '@number-flow/react'
import { isDefinedError } from '@orpc/client'
import { RiBardLine } from '@remixicon/react'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { resourceEnumsQueryOptions } from '~/entities/connection/queries'
import { useAiLocked } from '~/entities/user/hooks'
import { orpc } from '~/lib/orpc'
import { appStore, setIsSubscriptionDialogOpen } from '~/store'
import { Route } from '../..'
import { useTableColumns } from '../../-queries/use-columns-query'
import { useTablePageStore } from '../../-store'

export function HeaderSearch({ table, schema }: { table: string, schema: string }) {
  const isOnline = useSubscription(appStore, { selector: state => state.isOnline })
  const { isAiLocked, isAnonymous } = useAiLocked()
  const { connectionResource } = Route.useRouteContext()
  const inputRef = useRef<HTMLInputElement>(null)
  const store = useTablePageStore()
  const prompt = useSubscription(store, { selector: state => state.prompt })
  const [freeAiUsage, setFreeAiUsage] = useState<{ remaining: number, max: number, resetAt: Date } | null>(null)
  const { mutate: generateFilter, isPending } = useMutation(orpc.ai.filters.mutationOptions({
    onSuccess: (data) => {
      const hasOrderBy = Object.keys(data.orderBy).length > 0
      store.set(state => ({
        ...state,
        orderBy: data.orderBy,
        filters: data.filters
          .map(filter => ({
            column: filter.column,
            ref: SQL_FILTERS_LIST.find(f => f.operator === filter.operator),
            values: filter.values,
          } satisfies Omit<ActiveFilter, 'ref'> & { ref?: ActiveFilter['ref'] }))
          // For future updates if we'll have new filters
          .filter(f => !!f.ref) as ActiveFilter[],
      } satisfies typeof state))

      if (data.filters.length === 0 && !hasOrderBy) {
        toast.info('No filters or ordering were generated, please try again with a different prompt', {
          id: 'no-filters-or-ordering',
        })
      }

      setFreeAiUsage(data.freeAiUsage || null)

      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    },
    onError: (error) => {
      if (isDefinedError(error)) {
        setFreeAiUsage(error.data)
      }
    },
  }))
  const columns = useTableColumns({ connectionResource, table, schema })
  const { data: enums } = useQuery(resourceEnumsQueryOptions({ connectionResource }))
  const context = `
    Filters working with AND operator.
    Table name: ${table}
    Schema name: ${schema}
    Columns: ${JSON.stringify(columns?.map(col => ({
      id: col.id,
      type: col.type,
      default: col.default,
      isNullable: col.isNullable,
    })), null, 2)}
    Enums: ${JSON.stringify(enums, null, 2)}
  `.trim()

  useHotkey('Mod+F', () => {
    inputRef.current?.focus()
  })

  return (
    <form
      className="relative w-full max-w-full"
      onSubmit={(e) => {
        e.preventDefault()
        if (isAiLocked) {
          if (!isAnonymous)
            setIsSubscriptionDialogOpen(true)
          return
        }
        if (prompt.trim() === '') {
          toast.info('Please enter a prompt to generate filters', {
            id: 'no-prompt',
          })
          return
        }

        generateFilter({ prompt, context })
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            <InputGroup>
              <InputGroupInput
                ref={inputRef}
                placeholder={isOnline ? 'Ask AI to filter data...' : 'Check your internet connection to ask AI'}
                disabled={!isOnline || isPending || isAiLocked || freeAiUsage?.remaining === 0}
                value={prompt}
                autoFocus
                onChange={e => store.set(state => ({ ...state, prompt: e.target.value } satisfies typeof state))}
              />
              <InputGroupAddon>
                <LoadingContent
                  className="pointer-events-none size-4 text-muted-foreground"
                  loading={isPending}
                >
                  <RiBardLine />
                </LoadingContent>
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                {freeAiUsage && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="
                          cursor-help text-xs whitespace-nowrap
                          text-muted-foreground
                        "
                        tabIndex={0}
                        aria-label={`You have ${freeAiUsage.remaining} out of ${freeAiUsage.max} free AI filter uses left this month.`}
                      >
                        <NumberFlow
                          value={freeAiUsage.remaining}
                          className="tabular-nums"
                        />
                        /
                        {freeAiUsage.max}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      You have
                      {' '}
                      {freeAiUsage.remaining}
                      /
                      {freeAiUsage.max}
                      {' '}
                      free AI filter uses left this month. Reset at
                      {' '}
                      {format(freeAiUsage.resetAt, 'MMM d, yyyy')}
                      .
                    </TooltipContent>
                  </Tooltip>
                )}
                <KbdCtrlLetter userAgent={navigator.userAgent} letter="F" />
              </InputGroupAddon>
            </InputGroup>
          </div>
        </TooltipTrigger>
        {isAiLocked && (
          <TooltipContent>
            {isAnonymous ? 'Sign in to use AI filters' : 'Upgrade to Pro to use AI filters'}
          </TooltipContent>
        )}
      </Tooltip>
    </form>
  )
}
