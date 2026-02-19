import type { ActiveFilter } from '@conar/shared/filters'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import { isCtrlAndKey } from '@conar/shared/utils/os'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { CtrlLetter } from '@conar/ui/components/custom/shortcuts'
import { Input } from '@conar/ui/components/input'
import { Kbd } from '@conar/ui/components/kbd'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { isDefinedError } from '@orpc/client'
import { RiBardLine, RiCheckLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { format } from 'date-fns'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useConnectionEnums } from '~/entities/connection/queries'
import { orpcQuery } from '~/lib/orpc'
import { appStore } from '~/store'
import { Route } from '../../'
import { useTableColumns } from '../../-queries/use-columns-query'
import { usePageStoreContext } from '../../-store'

export function HeaderSearch({ table, schema }: { table: string, schema: string }) {
  const isOnline = useStore(appStore, state => state.isOnline)
  const { connection } = Route.useLoaderData()
  const inputRef = useRef<HTMLInputElement>(null)
  const store = usePageStoreContext()
  const prompt = useStore(store, state => state.prompt)
  const [freeAiUsage, setFreeAiUsage] = useState<{ remaining: number, max: number, resetAt: Date } | null>(null)
  const { mutate: generateFilter, isPending } = useMutation(orpcQuery.ai.filters.mutationOptions({
    onSuccess: (data) => {
      const hasOrderBy = Object.keys(data.orderBy).length > 0
      store.setState(state => ({
        ...state,
        orderBy: data.orderBy,
        filters: data.filters.map(filter => ({
          column: filter.column,
          ref: SQL_FILTERS_LIST.find(f => f.operator === filter.operator)!,
          values: filter.values,
        } satisfies ActiveFilter)),
      } satisfies typeof state))

      if (data.filters.length === 0 && !hasOrderBy) {
        toast.info('No filters or ordering were generated, please try again with a different prompt')
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
  const columns = useTableColumns({ connection, table, schema })
  const { data: enums } = useConnectionEnums({ connection })
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

  useKeyboardEvent(e => isCtrlAndKey(e, 'f'), () => {
    inputRef.current?.focus()
  })

  return (
    <form
      className="relative w-full max-w-full"
      onSubmit={(e) => {
        e.preventDefault()
        generateFilter({ prompt, context })
      }}
    >
      <LoadingContent
        className="
          pointer-events-none absolute top-1/2 left-2 -translate-y-1/2
          text-muted-foreground
        "
        loaderClassName="size-4"
        loading={isPending}
      >
        <ContentSwitch
          active={isPending}
          activeContent={<RiCheckLine className="size-4 text-success" />}
        >
          <RiBardLine className="size-4" />
        </ContentSwitch>
      </LoadingContent>
      <Input
        ref={inputRef}
        className={cn('pr-10 pl-8', freeAiUsage && 'pr-22')}
        placeholder={isOnline ? 'Ask AI to filter data...' : 'Check your internet connection to ask AI'}
        disabled={!isOnline || isPending || freeAiUsage?.remaining === 0}
        value={prompt}
        autoFocus
        onChange={e => store.setState(state => ({ ...state, prompt: e.target.value } satisfies typeof state))}
      />
      {freeAiUsage && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="
                  absolute top-1/2 right-12 -translate-y-1/2 cursor-help text-xs
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
        </TooltipProvider>
      )}
      <Kbd
        asChild
        className="absolute top-1/2 right-2 -translate-y-1/2"
      >
        <CtrlLetter userAgent={navigator.userAgent} letter="F" />
      </Kbd>
    </form>
  )
}
