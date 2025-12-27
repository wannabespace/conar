import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { Card, CardHeader, CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Input } from '@conar/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiCloseLine, RiFileList3Line, RiInformationLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useDatabaseIndexes, useDatabaseTablesAndSchemas } from '~/entities/database'

const MotionCard = motion.create(Card)

export const Route = createFileRoute('/(protected)/_protected/database/$id/indexes/')({
  component: DatabaseIndexesPage,
  loader: ({ context }) => ({ database: context.database }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title(`Indexes - ${loaderData.database.name}`) }] : [],
  }),
})

interface IndexItem {
  schema: string
  table: string
  name: string
  column: string
  isUnique: boolean
  isPrimary: boolean
}

interface GroupedIndex extends IndexItem {
  columns: string[]
}

function DatabaseIndexesPage() {
  const { database } = Route.useLoaderData()
  const { data: indexes } = useDatabaseIndexes({ database })
  const { data } = useDatabaseTablesAndSchemas({ database })
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')

  if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
    setSelectedSchema(schemas[0])

  const groupedIndexes = indexes?.reduce<Record<string, GroupedIndex>>((acc, item) => {
    const indexItem = item as IndexItem

    if (indexItem.schema !== selectedSchema)
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

  const indexList = Object.values(groupedIndexes ?? {})

  return (
    <ScrollArea className="h-full rounded-lg border bg-background">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Indexes</h2>
          <div className="flex gap-2">
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
            {schemas.length > 1 && (
              <Select value={selectedSchema} onValueChange={setSelectedSchema}>
                <SelectTrigger className="w-[180px]">
                  <span className="mr-2 text-muted-foreground">schema</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schemas.map(schema => (
                    <SelectItem key={schema} value={schema}>{schema}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
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
                      <RiFileList3Line className="size-4 text-primary" />
                      <HighlightText text={item.name} match={search} />
                      {item.isPrimary && <Badge className="text-xs">Primary</Badge>}
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
                    {item.columns.map(col => (
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
