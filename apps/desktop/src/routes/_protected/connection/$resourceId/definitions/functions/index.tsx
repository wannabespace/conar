import type { functionsType } from '~/entities/connection/queries'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardMotion, CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiCodeSSlashLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { resourceFunctionsQueryOptions, resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { MOTION_BLOCK_PROPS } from '../-constants'

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

function DatabaseFunctionsPage() {
  const { connectionResource } = Route.useRouteContext()
  const { data: functions, refetch, isFetching, isPending, dataUpdatedAt } = useQuery(resourceFunctionsQueryOptions({ connectionResource }))
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, { selector: state => state.showSystem })
  const { data } = useQuery(resourceTablesAndSchemasQueryOptions({ silent: false, connectionResource, showSystem }))
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<typeof typeFilterOptions[number]['value']>('all')

  if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
    setSelectedSchema(schemas[0])

  useRefreshHotkey(refetch, isFetching)

  const filteredFunctions = functions?.filter(item =>
    item.schema === selectedSchema
    && (filterType === 'all' || filterType === item.type)
    && (!search
      || item.name.toLowerCase().includes(search.toLowerCase())
      || item.language.toLowerCase().includes(search.toLowerCase())
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
        {schemas.length > 1 && (
          <Select
            value={selectedSchema}
            onValueChange={(v) => {
              if (v) {
                setSelectedSchema(v)
              }
            }}
          >
            <SelectTrigger className="max-w-56 min-w-[180px]">
              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                <span className="shrink-0 text-muted-foreground">schema</span>
                <span className="truncate"><SelectValue /></span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {schemas.map(schema => (
                <SelectItem key={schema} value={schema}>{schema}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
                    <Badge variant="outline">
                      <HighlightText text={item.language} match={search} />
                    </Badge>
                    {item.return_type && (
                      <>
                        <span>returns</span>
                        <Badge variant="outline">
                          <HighlightText text={item.return_type} match={search} />
                        </Badge>
                      </>
                    )}
                    {item.argument_count > 0 && (
                      <span>
                        {item.argument_count}
                        {' '}
                        {item.argument_count === 1 ? 'arg' : 'args'}
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
