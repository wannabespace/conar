import type { SQL_OPERATORS_LIST } from '@connnect/shared/utils/sql'
import { Button } from '@connnect/ui/components/button'
import { ContentSwitch } from '@connnect/ui/components/custom/content-switch'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Input } from '@connnect/ui/components/input'
import { RiBardLine, RiCheckLine, RiSendPlaneLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { useDatabase, useDatabaseEnums } from '~/entities/database'
import { trpc } from '~/lib/trpc'
import { Route, usePageContext } from '..'
import { useColumnsQuery } from '../-queries/use-columns-query'

export function HeaderSearch() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const { store } = usePageContext()
  const prompt = useStore(store, state => state.prompt)
  const { mutate: generateFilter, isPending } = useMutation({
    mutationFn: trpc.ai.sqlFilters.mutate,
    onSuccess: (data) => {
      store.setState(state => ({
        ...state,
        filters: data.map(filter => ({
          column: filter.column,
          operator: filter.operator as typeof SQL_OPERATORS_LIST[number]['value'],
          value: filter.value,
        })),
      }))

      if (data.length === 0) {
        toast.info('No filters were generated, please try again with a different prompt')
      }
    },
  })
  const { data: columns } = useColumnsQuery(database, table, schema)
  const { data: enums } = useDatabaseEnums(database)
  const context = useMemo(() => `
    Filters working with AND operator.
    Table name: ${table}
    Schema name: ${schema}
    Current filters: ${JSON.stringify(store.state.filters, null, 2)}
    Columns: ${JSON.stringify(columns, null, 2)}
    Enums: ${JSON.stringify(enums, null, 2)}
  `.trim(), [columns, enums, schema, table])

  return (
    <form
      className="relative max-w-full w-60 has-focus-visible:w-full transition-all duration-300 ease-in-out"
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
        onChange={e => store.setState(state => ({ ...state, prompt: e.target.value }))}
      />
      <Button
        type="submit"
        variant="secondary"
        size="iconXs"
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
