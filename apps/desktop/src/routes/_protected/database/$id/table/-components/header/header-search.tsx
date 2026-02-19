import type { ActiveFilter } from '@conar/shared/filters'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import { CtrlLetter } from '@conar/ui/components/custom/shortcuts'
import { Input } from '@conar/ui/components/input'
import { Kbd } from '@conar/ui/components/kbd'
import { RiBardLine } from '@remixicon/react'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useMemo, useRef } from 'react'
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
  const columns = useTableColumns({ connection, table, schema })
  const { data: enums } = useConnectionEnums({ connection })
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

  useHotkey('Mod+F', () => {
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
      <RiBardLine className="
        pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2
        text-muted-foreground
      "
      />
      <Input
        ref={inputRef}
        className="pr-10 pl-8"
        placeholder={isOnline ? 'Ask AI to filter data...' : 'Check your internet connection to ask AI'}
        disabled={isPending || !isOnline}
        value={prompt}
        autoFocus
        onChange={e => store.setState(state => ({ ...state, prompt: e.target.value } satisfies typeof state))}
      />
      <Kbd
        asChild
        className="absolute top-1/2 right-2 -translate-y-1/2"
      >
        <CtrlLetter userAgent={navigator.userAgent} letter="F" />
      </Kbd>
    </form>
  )
}
