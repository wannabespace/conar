import type { ActiveFilter } from '@conar/shared/filters'
import { SQL_FILTERS_LIST } from '@conar/shared/filters/sql'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Input } from '@conar/ui/components/input'
import { RiBardLine, RiCheckLine, RiSendPlaneLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { useDatabaseEnums } from '~/entities/database'
import { orpcQuery } from '~/lib/orpc'
import { Route } from '..'
import { useTableColumns } from '../-queries/use-columns-query'
import { usePageStoreContext } from '../-store'

export function HeaderSearch({ table, schema }: { table: string, schema: string }) {
  const { database } = Route.useLoaderData()
  const store = usePageStoreContext()
  const prompt = useStore(store, state => state.prompt)
  const { mutate: generateFilter, isPending } = useMutation(orpcQuery.ai.filters.mutationOptions({
    onSuccess: (data) => {
      store.setState(state => ({
        ...state,
        // ...(data.orderBy && Object.keys(data.orderBy).length > 0 ? { orderBy: data.orderBy } : {}),
        filters: data.filters.map(filter => ({
          column: filter.column,
          ref: SQL_FILTERS_LIST.find(f => f.operator === filter.operator)!,
          values: filter.values,
        } satisfies ActiveFilter)),
      } satisfies typeof state))

      if (data.filters.length === 0) {
        toast.info('No filters were generated, please try again with a different prompt')
      }
    },
  }))
  const columns = useTableColumns({ database, table, schema })
  const { data: enums } = useDatabaseEnums({ database })
  const context = useMemo(() => `
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
  `.trim(), [columns, enums, schema, table])

  return (
    <form
      className="relative max-w-full w-80 has-focus-visible:w-full transition-all duration-300 ease-in-out"
      onSubmit={(e) => {
        e.preventDefault()
        generateFilter({ prompt, context })
      }}
    >
      <RiBardLine className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        className="pl-8 pr-10 w-full focus-visible:ring-0 focus-visible:border-border"
        placeholder="Ask AI to filter data..."
        disabled={isPending}
        value={prompt}
        onChange={e => store.setState(state => ({ ...state, prompt: e.target.value } satisfies typeof state))}
      />
      <Button
        type="submit"
        variant="secondary"
        size="icon-xs"
        disabled={isPending}
        className="absolute right-2 top-1/2 -translate-y-1/2"
      >
        <LoadingContent loading={isPending} loaderClassName="size-3">
          <ContentSwitch
            activeContent={<RiCheckLine className="size-3 text-success" />}
            active={!isPending}
          >
            <RiSendPlaneLine className="size-3" />
          </ContentSwitch>
        </LoadingContent>
      </Button>
    </form>
  )
}
