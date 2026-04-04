import type { constraintsType } from '~/entities/connection/queries'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardTitle } from '@conar/ui/components/card'
import { CardMotion } from '@conar/ui/components/card.motion'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiDatabase2Line, RiKey2Line, RiLayoutColumnLine, RiLinksLine, RiTable2 } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { resourceConstraintsQueryOptions } from '~/entities/connection/queries'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { SchemaSelect } from '../-components/schema-select'
import { MOTION_BLOCK_PROPS } from '../-constants'
import { useDefinitionsState } from '../-hooks/use-definitions-state'

export const Route = createFileRoute('/_protected/connection/$resourceId/definitions/constraints/')({
  component: DatabaseConstraintsPage,
  loader: ({ context }) => ({ connection: context.connection, connectionResource: context.connectionResource }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Constraints', loaderData.connection.name, loaderData.connectionResource.name) }] : [],
  }),
})

type ConstraintType = typeof constraintsType.infer['type']

const filterOptions: { label: string, value: ConstraintType | 'all' }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Primary Key', value: 'primaryKey' },
  { label: 'Foreign Key', value: 'foreignKey' },
  { label: 'Unique', value: 'unique' },
]

function getIcon(type: ConstraintType) {
  switch (type) {
    case 'primaryKey':
    case 'unique':
      return <RiKey2Line className="size-4 text-primary" />
    case 'foreignKey':
      return <RiLinksLine className="size-4 text-primary" />
    default:
      return <RiDatabase2Line className="size-4 text-primary" />
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function DatabaseConstraintsPage() {
  const { connectionResource } = Route.useRouteContext()
  const { data: constraints, refetch, isFetching, isPending, dataUpdatedAt } = useQuery(resourceConstraintsQueryOptions({ connectionResource }))
  const { schemas, selectedSchema, setSelectedSchema, search, setSearch } = useDefinitionsState({ connectionResource })
  const [filterType, setFilterType] = useState<typeof filterOptions[number]['value']>('all')

  useRefreshHotkey(refetch, isFetching)

  const filteredConstraints = constraints?.filter(item =>
    item.schema === selectedSchema
    && (filterType === 'all' || filterType === item.type)
    && (!search
      || item.name.toLowerCase().includes(search.toLowerCase())
      || item.table.toLowerCase().includes(search.toLowerCase())
      || (item.column && item.column.toLowerCase().includes(search.toLowerCase()))
      || (item.type && item.type.toLowerCase().includes(search.toLowerCase()))
    ),
  ) ?? []

  return (
    <>
      <DefinitionsHeader
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        dataUpdatedAt={dataUpdatedAt}
      >
        Constraints
      </DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search constraints"
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
              {value => value ? filterOptions.find(option => option.value === value)?.label : 'Filter Type'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SchemaSelect schemas={schemas} selectedSchema={selectedSchema} setSelectedSchema={setSelectedSchema} />
      </div>
      <DefinitionsGrid loading={isPending}>
        {filteredConstraints.length === 0 && (
          <DefinitionsEmptyState
            title="No constraints found"
            description="This schema doesn't have any constraints matching your filter."
          />
        )}

        {filteredConstraints.map(item => (
          <CardMotion
            key={`${item.schema}-${item.table}-${item.name}-${item.column}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-2 text-base">
                    {getIcon(item.type)}
                    <HighlightText text={item.name} match={search} />
                    <Badge variant="secondary">
                      {filterOptions.find(option => option.value === item.type)?.label}
                    </Badge>
                  </CardTitle>
                  <div className={`
                    flex items-center gap-1.5 text-sm text-muted-foreground
                  `}
                  >
                    <Badge variant="outline">
                      <RiTable2 className="size-3" />
                      <HighlightText text={item.table} match={search} />
                    </Badge>
                    {item.column && (
                      <>
                        <span>on</span>
                        <Badge variant="outline">
                          <RiLayoutColumnLine className="size-3" />
                          <HighlightText text={item.column} match={search} />
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            {item.type === 'foreignKey' && (
              <CardContent className="border-t bg-muted/10 px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">References:</span>
                  <Badge variant="outline">
                    {item.foreignSchema}
                    .
                    {item.foreignTable}
                  </Badge>
                  column
                  <Badge variant="outline">{item.foreignColumn}</Badge>
                </div>
              </CardContent>
            )}
          </CardMotion>
        ))}
      </DefinitionsGrid>
    </>
  )
}
