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
import { useMemo, useState } from 'react'
import { useConnectionIndexes, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { connectionStore } from '~/entities/connection/store'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsHeader } from '../-components/header'
import { VirtualDefinitionsGrid } from '../-components/virtual-grid'
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
  const store = connectionStore(connection.id)
  const showSystem = useStore(store, state => state.showSystem)
  const { data } = useConnectionTablesAndSchemas({ connection, showSystem })
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<IndexType | 'all'>('all')

  if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
    setSelectedSchema(schemas[0])

  const groupedIndexes = useMemo(() => {
    if (!indexes)
      return {}

    const lowerSearch = search?.trim().toLowerCase()
    const result: Record<string, GroupedIndex> = {}

    for (const indexItem of indexes) {
      if (indexItem.schema !== selectedSchema)
        continue

      if (filterType !== 'all' && filterType !== getIndexType(indexItem))
        continue

      const matchesSearch = !lowerSearch
        || indexItem.name.toLowerCase().includes(lowerSearch)
        || indexItem.table.toLowerCase().includes(lowerSearch)
        || (indexItem.column && indexItem.column.toLowerCase().includes(lowerSearch))
        || (indexItem.customExpression && indexItem.customExpression.toLowerCase().includes(lowerSearch))

      if (!matchesSearch)
        continue

      const key = `${indexItem.schema}-${indexItem.table}-${indexItem.name}`
      const column = indexItem.column ?? indexItem.customExpression ?? null

      if (!result[key]) {
        result[key] = { ...indexItem, columns: column ? [column] : [] }
      }
      else if (column && !result[key].columns.includes(column)) {
        result[key].columns.push(column)
      }
    }

    return result
  }, [indexes, search, selectedSchema, filterType])

  const indexList = useMemo(() => Object.values(groupedIndexes), [groupedIndexes])

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
      <VirtualDefinitionsGrid
        loading={isPending}
        items={indexList}
        emptyState={(
          <DefinitionsEmptyState
            title="No indexes found"
            description="This schema doesn't have any indexes matching your filter."
          />
        )}
        renderItem={item => (
          <MotionCard {...MOTION_BLOCK_PROPS}>
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
                    {(item.columns?.some(col => col?.trim()) ?? false) || item.customExpression
                      ? (
                          <>
                            <span>on</span>
                            {item.columns
                              ?.filter(col => col?.trim())
                              .map(col => (
                                <Badge key={col} variant="outline">
                                  <RiLayoutColumnLine className="size-3" />
                                  <HighlightText text={col} match={search} />
                                </Badge>
                              ))}
                            {!(item.columns?.some(col => col?.trim()) ?? false) && item.customExpression && (
                              <Badge variant="outline">
                                <RiLayoutColumnLine className="size-3" />
                                <HighlightText text={item.customExpression} match={search} />
                              </Badge>
                            )}
                          </>
                        )
                      : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </MotionCard>
        )}
      />
    </>
  )
}
