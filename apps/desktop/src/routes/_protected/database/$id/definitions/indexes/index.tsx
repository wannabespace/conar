import type { indexesType } from '~/entities/connection/sql/indexes'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardHeader, CardTitle, MotionCard } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiFileList3Line, RiKey2Line, RiLayoutColumnLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useConnectionIndexes, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
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

interface GroupedIndex extends IndexItem {
  columns: string[]
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
  const { data } = useConnectionTablesAndSchemas({ connection })
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
      || indexItem.column.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch)
      return acc

    const key = `${indexItem.schema}-${indexItem.table}-${indexItem.name}`

    return {
      ...acc,
      [key]: acc[key]
        ? {
            ...acc[key],
            columns: acc[key].columns.includes(indexItem.column)
              ? acc[key].columns
              : [...acc[key].columns, indexItem.column],
          }
        : { ...indexItem, columns: [indexItem.column] },
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
      <div className="flex items-center gap-2 mb-4">
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
            <CardHeader className="bg-muted/30 px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {item.isPrimary
                      ? <RiKey2Line className="size-4 text-primary" />
                      : <RiFileList3Line className="size-4 text-primary" />}
                    <HighlightText text={item.name} match={search} />
                    {item.isPrimary && (
                      <Badge
                        variant="secondary"
                        className="ml-2 text-xs font-normal"
                      >
                        Primary Key
                      </Badge>
                    )}
                    {item.isUnique && !item.isPrimary && (
                      <Badge variant="secondary" className="text-xs">
                        Unique
                      </Badge>
                    )}
                  </CardTitle>
                  <div className={`
                    mt-2 flex items-center gap-2 text-sm text-muted-foreground
                  `}
                  >
                    <Badge variant="outline" className="text-xs font-normal">
                      <RiTable2 className="mr-1 size-3" />
                      <HighlightText text={item.table} match={search} />
                    </Badge>
                    <span>on</span>
                    {item.columns.map((col: string) => (
                      <Badge
                        key={col}
                        variant="outline"
                        className="font-mono text-xs"
                      >
                        <RiLayoutColumnLine className="mr-1 size-3" />
                        <HighlightText text={col} match={search} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
          </MotionCard>
        ))}
      </DefinitionsGrid>
    </>
  )
}
