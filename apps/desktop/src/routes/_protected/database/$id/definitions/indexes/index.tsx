import type { indexesType } from '~/entities/connection/sql/indexes'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { CardHeader, CardTitle, MotionCard } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { Input } from '@conar/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiFileList3Line, RiInformationLine, RiKey2Line, RiRefreshLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { useConnectionIndexes, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
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

const dropdownItems: { label: string, value: IndexType }[] = [
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
  const { data: indexes, refetch, isRefetching } = useConnectionIndexes({ connection })
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
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Indexes</h2>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Input
            placeholder="Search indexes"
            className="w-[200px] pr-8"
            value={search}
            autoFocus
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className={`
                absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1
              `}
              onClick={() => setSearch('')}
            >
              <RiCloseLine className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={filterType} onValueChange={value => setFilterType(value as IndexType | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {dropdownItems.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
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
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RiRefreshLine className={cn('size-4', isRefetching && `animate-spin`)} />
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-4">
        <AnimatePresence initial={false} mode="popLayout">
          {indexList.length === 0 && (
            <MotionCard
              layout
              {...MOTION_BLOCK_PROPS}
            >
              <RiInformationLine className={`
                mx-auto mb-3 size-12 text-muted-foreground
              `}
              />
              <h3 className="text-lg font-medium">No indexes found</h3>
            </MotionCard>
          )}
          {indexList.map(item => (
            <MotionCard
              key={`${item.schema}-${item.table}-${item.name}`}
              layout
              {...MOTION_BLOCK_PROPS}
            >
              <CardHeader className="bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between">
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
                      <Badge
                        variant="secondary"
                        className="text-xs"
                      >
                        Unique
                      </Badge>
                    )}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-normal">
                    <RiTable2 className="mr-1 size-3" />
                    {item.table}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.columns.map((col: string) => (
                    <Badge
                      key={col}
                      variant="secondary"
                      className="font-mono text-xs"
                    >
                      {col}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
            </MotionCard>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
