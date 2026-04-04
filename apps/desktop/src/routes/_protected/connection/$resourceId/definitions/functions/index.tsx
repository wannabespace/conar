import type { functionsType } from '~/entities/connection/queries'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardTitle } from '@conar/ui/components/card'
import { CardMotion } from '@conar/ui/components/card.motion'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiCodeSSlashLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { SchemaSelect } from '../-components/schema-select'
import { MOTION_BLOCK_PROPS } from '../-constants'
import { useDefinitionsState } from '../-hooks/use-definitions-state'

export const Route = createFileRoute('/_protected/connection/$resourceId/definitions/functions/')({
  component: DatabaseFunctionsPage,
  loader: ({ context }) => ({ connection: context.connection, connectionResource: context.connectionResource }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Functions', loaderData.connection.name, loaderData.connectionResource.name) }] : [],
  }),
})

type FunctionType = typeof functionsType.infer['type']

const typeFilterOptions: { label: string, value: FunctionType | 'all' }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Function', value: 'function' },
  { label: 'Procedure', value: 'procedure' },
]

// eslint-disable-next-line react-refresh/only-export-components
function DatabaseFunctionsPage() {
  const { connectionResource } = Route.useRouteContext()
  const { data: functions, refetch, isFetching, isPending, dataUpdatedAt } = useQuery(resourceFunctionsQueryOptions({ connectionResource }))
  const { schemas, selectedSchema, setSelectedSchema, search, setSearch } = useDefinitionsState({ connectionResource })
  const [filterType, setFilterType] = useState<typeof typeFilterOptions[number]['value']>('all')

  useRefreshHotkey(refetch, isFetching)

  const filteredFunctions = functions?.filter(item =>
    item.schema === selectedSchema
    && (filterType === 'all' || filterType === item.type)
    && (!search
      || item.name.toLowerCase().includes(search.toLowerCase())
      || item.language?.toLowerCase().includes(search.toLowerCase())
      || (item.return_type && item.return_type.toLowerCase().includes(search.toLowerCase()))
    ),
  ) ?? []

  return (
    <>
      <DefinitionsHeader
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        dataUpdatedAt={dataUpdatedAt}
      >
        Functions
      </DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search functions"
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <Select
          value={filterType}
          onValueChange={(v) => {
            if (v) {
              setFilterType(v)
            }
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Type">
              {value => value ? typeFilterOptions.find(option => option.value === value)?.label : 'Filter Type'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {typeFilterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SchemaSelect schemas={schemas} selectedSchema={selectedSchema} setSelectedSchema={setSelectedSchema} />
      </div>
      <DefinitionsGrid loading={isPending}>
        {filteredFunctions.length === 0 && (
          <DefinitionsEmptyState
            title="No functions found"
            description="This schema doesn't have any functions matching your filter."
          />
        )}

        {filteredFunctions.map(item => (
          <CardMotion
            key={`${item.schema}-${item.name}-${item.type}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-2 text-base">
                    <RiCodeSSlashLine className="size-4 text-primary" />
                    <HighlightText text={item.name} match={search} />
                    <Badge variant="secondary">
                      {item.type === 'function' ? 'Function' : 'Procedure'}
                    </Badge>
                  </CardTitle>
                  <div className="
                    flex items-center gap-1.5 text-sm text-muted-foreground
                  "
                  >
                    {item.language && (
                      <Badge variant="outline">
                        <HighlightText text={item.language} match={search} />
                      </Badge>
                    )}
                    {item.return_type && (
                      <>
                        <span>returns</span>
                        <Badge variant="outline">
                          <HighlightText text={item.return_type} match={search} />
                        </Badge>
                      </>
                    )}
                    {!!item.argumentCount && (
                      <span>
                        {item.argumentCount}
                        {' '}
                        {item.argumentCount === 1 ? 'arg' : 'args'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </CardMotion>
        ))}
      </DefinitionsGrid>
    </>
  )
}
