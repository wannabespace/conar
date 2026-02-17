import type { constraintsType } from '~/entities/connection/sql/constraints'
import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardTitle, MotionCard } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiDatabase2Line, RiKey2Line, RiLayoutColumnLine, RiLinksLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useMemo, useState } from 'react'
import { useConnectionConstraints, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { connectionStore } from '~/entities/connection/store'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsHeader } from '../-components/header'
import { VirtualDefinitionsGrid } from '../-components/virtual-grid'
import { MOTION_BLOCK_PROPS } from '../-constants'

export const Route = createFileRoute('/_protected/database/$id/definitions/constraints/')({
  component: DatabaseConstraintsPage,
  loader: ({ context }) => ({ connection: context.connection }),
  head: ({ loaderData }) => ({
    meta: loaderData?.connection ? [{ title: title('Constraints', loaderData.connection.name) }] : [],
  }),
})

type ConstraintType = typeof constraintsType.infer['type']

const filterOptions: { label: string, value: ConstraintType }[] = [
  { label: 'Primary Key', value: 'primaryKey' },
  { label: 'Foreign Key', value: 'foreignKey' },
  { label: 'Unique', value: 'unique' },
]

function formatType(type: ConstraintType) {
  switch (type) {
    case 'primaryKey': return 'Primary Key'
    case 'foreignKey': return 'Foreign Key'
    default:
      return uppercaseFirst(type)
  }
}

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

function DatabaseConstraintsPage() {
  const { connection } = Route.useLoaderData()
  const { data: constraints, refetch, isFetching, isPending, dataUpdatedAt } = useConnectionConstraints({ connection })
  const store = connectionStore(connection.id)
  const showSystem = useStore(store, state => state.showSystem)
  const { data } = useConnectionTablesAndSchemas({ connection, showSystem })
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<ConstraintType | 'all'>('all')

  if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
    setSelectedSchema(schemas[0])

  const filteredConstraints = useMemo(() => {
    if (!constraints)
      return []

    const lowerSearch = search?.trim().toLowerCase()

    return constraints.filter((item) => {
      if (item.schema !== selectedSchema)
        return false

      if (filterType !== 'all' && filterType !== item.type)
        return false

      if (!lowerSearch)
        return true

      return item.name.toLowerCase().includes(lowerSearch)
        || item.table.toLowerCase().includes(lowerSearch)
        || (item.column && item.column.toLowerCase().includes(lowerSearch))
        || (item.type && item.type.toLowerCase().includes(lowerSearch))
    })
  }, [constraints, search, selectedSchema, filterType])

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
        <Select value={filterType} onValueChange={v => setFilterType(v as ConstraintType | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {filterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {schemas.length > 1 && (
          <Select value={selectedSchema ?? ''} onValueChange={setSelectedSchema}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">schema</span>
                <SelectValue />
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
      <VirtualDefinitionsGrid
        loading={isPending}
        items={filteredConstraints}
        emptyState={(
          <DefinitionsEmptyState
            title="No constraints found"
            description="This schema doesn't have any constraints matching your filter."
          />
        )}
        renderItem={item => (
          <MotionCard
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-2 text-base">
                    {getIcon(item.type)}
                    <HighlightText text={item.name} match={search} />
                    <Badge variant="secondary">
                      {formatType(item.type)}
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
          </MotionCard>
        )}
      />
    </>
  )
}
