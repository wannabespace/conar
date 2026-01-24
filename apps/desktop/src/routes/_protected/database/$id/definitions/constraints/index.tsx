import type { constraintsType } from '~/entities/connection/sql/constraints'
import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { Input } from '@conar/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiDatabase2Line, RiInformationLine, RiKey2Line, RiLinksLine, RiRefreshLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useConnectionConstraints, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { DefinitionsSkeleton } from '../-components/skeleton'

const MotionCard = motion.create(Card)

export const Route = createFileRoute('/_protected/database/$id/definitions/constraints/')({
  component: DatabaseConstraintsPage,
  loader: ({ context }) => ({ connection: context.connection }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title(`Constraints - ${loaderData.connection.name}`) }] : [],
  }),
})

type ConstraintItem = typeof constraintsType.infer

const dropDownItems: { label: string, value: ConstraintItem['type'] }[] = [
  { label: 'Primary Key', value: 'primaryKey' },
  { label: 'Foreign Key', value: 'foreignKey' },
  { label: 'Unique Key', value: 'unique' },
]

function formatType(type: ConstraintItem['type']) {
  switch (type) {
    case 'primaryKey': return 'Primary Key'
    case 'foreignKey': return 'Foreign Key'
    default:
      return uppercaseFirst(type)
  }
}

function getIcon(type: ConstraintItem['type']) {
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
  const { data: constraints, refetch, isRefetching, isPending } = useConnectionConstraints({ connection })
  const { data } = useConnectionTablesAndSchemas({ connection })
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<ConstraintItem['type'] | 'all'>('all')

  if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
    setSelectedSchema(schemas[0])

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
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Constraints</h2>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Input
            placeholder="Search constraints"
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
        <Select value={filterType} onValueChange={value => setFilterType(value as ConstraintItem['type'] | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {dropDownItems.map(type => (
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
        {isPending || isRefetching
          ? <DefinitionsSkeleton />
          : (
              <AnimatePresence initial={false} mode="popLayout">
                {filteredConstraints.length === 0 && (
                  <MotionCard
                    layout
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    transition={{ duration: 0.15 }}
                    className={`
                      mt-4 w-full border border-dashed
                      border-muted-foreground/20 bg-muted/10 p-10 text-center
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
                          <CardTitle className="
                            flex items-center gap-2 text-base
                          "
                          >
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
                            <Badge
                              variant="outline"
                              className="text-xs font-normal"
                            >
                              <RiTable2 className="mr-1 size-3" />
                              {item.table}
                            </Badge>
                            {item.column && (
                              <span className="flex items-center gap-2">
                                <span>on</span>
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
                      <CardContent className="
                        border-t bg-muted/10 px-4 py-3 text-sm
                      "
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
            )}
      </div>
    </>
  )
}
