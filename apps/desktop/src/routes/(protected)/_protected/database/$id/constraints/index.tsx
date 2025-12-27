import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Input } from '@conar/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiCloseLine, RiDatabase2Line, RiInformationLine, RiKey2Line, RiLinksLine, RiShieldCheckLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useDatabaseConstraints, useDatabaseTablesAndSchemas } from '~/entities/database'

const MotionCard = motion.create(Card)

export const Route = createFileRoute('/(protected)/_protected/database/$id/constraints/')({
  component: DatabaseConstraintsPage,
  loader: ({ context }) => ({ database: context.database }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title(`Constraints - ${loaderData.database.name}`) }] : [],
  }),
})

function DatabaseConstraintsPage() {
  const { database } = Route.useLoaderData()
  const { data: constraints } = useDatabaseConstraints({ database })
  const { data } = useDatabaseTablesAndSchemas({ database })
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
      setSelectedSchema(schemas[0])
  }, [schemas, selectedSchema])

  const filteredConstraints = useMemo(() => {
    return constraints?.filter(item =>
      item.schema === selectedSchema
      && (!search
        || item.name.toLowerCase().includes(search.toLowerCase())
        || item.table.toLowerCase().includes(search.toLowerCase())
        || (item.column && item.column.toLowerCase().includes(search.toLowerCase()))
        || (item.type && item.type.toLowerCase().includes(search.toLowerCase()))
      ),
    ) ?? []
  }, [constraints, selectedSchema, search])

  const getIcon = (type: string) => {
    switch (type) {
      case 'primaryKey':
      case 'unique':
        return <RiKey2Line className="size-4 text-primary" />
      case 'foreignKey':
        return <RiLinksLine className="size-4 text-primary" />
      case 'check':
        return <RiShieldCheckLine className="size-4 text-primary" />
      default:
        return <RiDatabase2Line className="size-4 text-primary" />
    }
  }

  const formatType = (type: string) => {
    switch (type) {
      case 'primaryKey': return 'Primary Key'
      case 'foreignKey': return 'Foreign Key'
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  return (
    <ScrollArea className="h-full rounded-lg border bg-background">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Constraints</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Input
                placeholder="Search constraints"
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
            {filteredConstraints.length === 0 && (
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
                <h3 className="text-lg font-medium">No constraints found</h3>
                <p className="text-sm text-muted-foreground">This schema doesn't have any constraints matching your filter.</p>
              </MotionCard>
            )}

            {filteredConstraints.map(item => (
              <MotionCard
                key={`${item.schema}-${item.table}-${item.name}-${item.column}`}
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
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {getIcon(item.type)}
                        <HighlightText text={item.name} match={search} />
                        <Badge
                          variant="secondary"
                          className="ml-2 text-xs font-normal"
                        >
                          {formatType(item.type)}
                        </Badge>
                      </CardTitle>
                      <div className={`
                        mt-2 flex items-center gap-2 text-sm
                        text-muted-foreground
                      `}
                      >
                        <Badge variant="outline" className="text-xs font-normal">
                          <RiTable2 className="mr-1 size-3" />
                          {item.table}
                        </Badge>
                        {item.column && (
                          <span className="flex items-center">
                            <span className="mx-1">on</span>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {item.column}
                            </Badge>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {item.type === 'foreignKey' && (
                  <CardContent className={`
                    border-t bg-muted/10 px-4 py-3 text-sm
                  `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">References:</span>
                      <Badge variant="outline">
                        {item.foreignSchema}
                        .
                        {item.foreignTable}
                      </Badge>
                      <span>column</span>
                      <Badge variant="outline" className="font-mono">{item.foreignColumn}</Badge>
                    </div>
                  </CardContent>
                )}
              </MotionCard>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ScrollArea>
  )
}
