import type { indexesType } from '~/entities/connection/sql/indexes'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardTitle, MotionCard } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiFileList3Line, RiKey2Line, RiLayoutColumnLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useState } from 'react'
import { useConnectionIndexes, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { connectionStore } from '~/entities/connection/store'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { MOTION_BLOCK_PROPS } from '../-constants'

export const Route = createFileRoute('/_protected/database/$id/definitions/indexes/')({
  component: DatabaseIndexesPage,
  loader: ({ context }) => ({ connection: context.connection }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Indexes', loaderData.connection.name) }] : [],
  }),
})

type IndexItem = typeof indexesType.infer

interface GroupedIndex extends Pick<IndexItem, 'schema' | 'table' | 'type' | 'name' | 'isUnique' | 'isPrimary'> {
  columns: string[]
  customExpressions: string[]
}

type IndexType = 'primary' | 'unique' | 'regular'

const filterOptions: { label: string, value: IndexType }[] = [
  { label: 'Primary Key', value: 'primary' },
  { label: 'Unique Index', value: 'unique' },
  { label: 'Regular Index', value: 'regular' },
]

function getIndexType(indexItem: IndexItem): IndexType {
  if (indexItem.isPrimary)
    return 'primary'
  if (indexItem.isUnique)
    return 'unique'
  return 'regular'
}

function DatabaseIndexesPage() {
  const { connection } = Route.useLoaderData()
  const { data: indexes, refetch, isFetching, isPending, dataUpdatedAt } = useConnectionIndexes({ connection })
  const store = connectionStore(connection.id)
  const showSystem = useStore(store, state => state.showSystem)
  const { data } = useConnectionTablesAndSchemas({ connection, showSystem })
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<IndexType | 'all'>('all')

  if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
    setSelectedSchema(schemas[0])

  const groupedIndexes = indexes?.reduce<Record<string, GroupedIndex>>((acc, indexItem) => {
    if (indexItem.schema !== selectedSchema)
      return acc

    const matchesFilter = filterType === 'all' || filterType === getIndexType(indexItem)

    if (!matchesFilter)
      return acc

    const matchesSearch = !search
      || indexItem.name.toLowerCase().includes(search.toLowerCase())
      || indexItem.table.toLowerCase().includes(search.toLowerCase())
      || indexItem.column?.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch)
      return acc

    const key = `${indexItem.schema}-${indexItem.table}-${indexItem.name}`

    return {
      ...acc,
      [key]: acc[key]
        ? {
            ...acc[key],
            columns: indexItem.column && !acc[key].columns.includes(indexItem.column)
              ? [...acc[key].columns, indexItem.column]
              : acc[key].columns,
            customExpressions: indexItem.customExpression && !acc[key].customExpressions.includes(indexItem.customExpression)
              ? [...acc[key].customExpressions, indexItem.customExpression]
              : acc[key].customExpressions,
          }
        : {
            ...indexItem,
            columns: indexItem.column ? [indexItem.column] : [],
            customExpressions: indexItem.customExpression ? [indexItem.customExpression] : [],
          },
    }
  }, {})

  const indexList = Object.values(groupedIndexes ?? {})

  return (
    <>
      <DefinitionsHeader
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        dataUpdatedAt={dataUpdatedAt}
      >
        Indexes
      </DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search indexes"
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <Select
          value={filterType}
          onValueChange={v => setFilterType(v as IndexType | 'all')}
        >
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
      <DefinitionsGrid loading={isPending}>
        {indexList.length === 0 && (
          <DefinitionsEmptyState
            title="No indexes found"
            description="This schema doesn't have any indexes matching your filter."
          />
        )}

        {indexList.map(item => (
          <MotionCard
            key={`${item.schema}-${item.table}-${item.name}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-2 text-base">
                    {item.isPrimary
                      ? <RiKey2Line className="size-4 text-primary" />
                      : <RiFileList3Line className="size-4 text-primary" />}
                    <HighlightText text={item.name} match={search} />
                    {item.isPrimary && (
                      <Badge variant="secondary">
                        Primary Key
                      </Badge>
                    )}
                    {item.isUnique && !item.isPrimary && (
                      <Badge variant="secondary">
                        Unique
                      </Badge>
                    )}
                  </CardTitle>
                  <div className={`
                    flex items-center gap-1.5 text-sm text-muted-foreground
                  `}
                  >
                    <Badge variant="outline">
                      <RiTable2 className="size-3" />
                      <HighlightText text={item.table} match={search} />
                    </Badge>
                    {(item.columns.length > 0 || item.customExpressions.length > 0) && (
                      <>
                        <span>on</span>
                        {[...item.columns, ...item.customExpressions].map(col => (
                          <Badge key={col} variant="outline">
                            <RiLayoutColumnLine className="size-3" />
                            <HighlightText text={col} match={search} />
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </MotionCard>
        ))}
      </DefinitionsGrid>
    </>
  )
}
