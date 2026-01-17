import type { indexesType } from '~/entities/database/sql/indexes'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card, CardHeader, CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@conar/ui/components/dropdown-menu'
import { Input } from '@conar/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiFileList3Line, RiFilter3Line, RiInformationLine, RiKey2Line, RiRefreshLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useDatabaseIndexes, useDatabaseTablesAndSchemas } from '~/entities/database/queries'

const MotionCard = motion.create(Card)

export const Route = createFileRoute('/_protected/database/$id/definitions/indexes/')({
  component: DatabaseIndexesPage,
  loader: ({ context }) => ({ database: context.database }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title(`Indexes - ${loaderData.database.name}`) }] : [],
  }),
})

type IndexItem = typeof indexesType.infer

interface GroupedIndex extends IndexItem {
  columns: string[]
}

type IndexType = 'primary' | 'unique' | 'regular'

const dropDownItems: { label: string, value: IndexType }[] = [
  { label: 'Primary Key', value: 'primary' },
  { label: 'Unique Index', value: 'unique' },
  { label: 'Regular Index', value: 'regular' },
]

function DatabaseIndexesPage() {
  const { database } = Route.useLoaderData()
  const { data: indexes, refetch, isRefetching } = useDatabaseIndexes({ database })
  const { data } = useDatabaseTablesAndSchemas({ database })
  const schemas = useMemo(() => data?.schemas.map(({ name }) => name) ?? [], [data])
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')
  const [filterTypes, setFilterTypes] = useState<IndexType[]>([])

  useEffect(() => {
    if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
      setSelectedSchema(schemas[0])
  }, [schemas, selectedSchema])

  const groupedIndexes = useMemo(() => {
    return indexes?.reduce<Record<string, GroupedIndex>>((acc: Record<string, GroupedIndex>, item: IndexItem) => {
      const indexItem = item

      if (indexItem.schema !== selectedSchema)
        return acc

      const isPrimary = indexItem.isPrimary
      const isUnique = indexItem.isUnique && !indexItem.isPrimary

      let type: IndexType = 'regular'
      if (isPrimary)
        type = 'primary'
      else if (isUnique)
        type = 'unique'

      const matchesFilter = filterTypes.length === 0 || filterTypes.includes(type)

      if (!matchesFilter)
        return acc

      const matchesSearch = !search
        || indexItem.name.toLowerCase().includes(search.toLowerCase())
        || indexItem.table.toLowerCase().includes(search.toLowerCase())
        || indexItem.column.toLowerCase().includes(search.toLowerCase())

      if (!matchesSearch)
        return acc

      const key = `${indexItem.schema}-${indexItem.table}-${indexItem.name}`
      if (!acc[key]) {
        acc[key] = {
          ...indexItem,
          columns: [indexItem.column],
        }
      }
      else {
        if (!acc[key].columns.includes(indexItem.column)) {
          acc[key].columns.push(indexItem.column)
        }
      }
      return acc
    }, {})
  }, [indexes, selectedSchema, search, filterTypes])

  const indexList = Object.values(groupedIndexes ?? {})

  const handleCheckedChange = (checked: boolean, value: IndexType) => {
    if (checked) {
      const newTypes = [...filterTypes, value]
      if (newTypes.length === dropDownItems.length)
        setFilterTypes([])
      else setFilterTypes(newTypes)
    }
    else {
      setFilterTypes(filterTypes.filter(t => t !== value))
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Indexes</h2>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search indexes"
              className="w-[200px] pr-8"
              value={search}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`
                  w-[180px] justify-start
                  focus-visible:ring-0 focus-visible:ring-offset-0
                `}
              >
                <RiFilter3Line className="mr-2 size-4 text-muted-foreground" />
                {filterTypes.length > 0
                  ? (
                      <span>
                        {filterTypes.length}
                        {' '}
                        selected
                      </span>
                    )
                  : <span className="text-muted-foreground">Filter Type</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[180px]">
              <DropdownMenuCheckboxItem
                checked={filterTypes.length === 0}
                onSelect={(e) => {
                  e.preventDefault()
                  setFilterTypes([])
                }}
              >
                Select All
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {dropDownItems.map(type => (
                <DropdownMenuCheckboxItem
                  key={type.value}
                  checked={filterTypes.includes(type.value)}
                  onSelect={e => e.preventDefault()}
                  onCheckedChange={checked => handleCheckedChange(checked, type.value)}
                >
                  {type.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
            <RiRefreshLine className={cn('size-4', isRefetching && `
              animate-spin
            `)}
            />
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-4">
          <AnimatePresence initial={false} mode="popLayout">
            {indexList.length === 0 && (
              <MotionCard
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`
                  mt-4 w-full border border-dashed border-muted-foreground/20
                  bg-muted/10 p-10 text-center
                `}
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`
                  overflow-hidden border border-border/60
                  hover:border-border/90
                `}
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
      </div>
    </ScrollArea>
  )
}
