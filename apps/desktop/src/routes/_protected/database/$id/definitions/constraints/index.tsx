import type { constraintsType } from '~/entities/connection/sql/constraints'
import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardHeader, CardTitle, MotionCard } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { RefreshButton } from '@conar/ui/components/custom/refresh-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiDatabase2Line, RiKey2Line, RiLinksLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useConnectionConstraints, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { DefinitionsSearchInput } from '../-components/search-input'
import { MOTION_BLOCK_PROPS } from '../-constants'

export const Route = createFileRoute('/_protected/database/$id/definitions/constraints/')({
  component: DatabaseConstraintsPage,
  loader: ({ context }) => ({ connection: context.connection }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Constraints', loaderData.connection.name) }] : [],
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
  const { data: constraints, refetch, isFetching, isPending } = useConnectionConstraints({ connection })
  const { data } = useConnectionTablesAndSchemas({ connection })
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<ConstraintType | 'all'>('all')

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
      <DefinitionsHeader title="Constraints">
        <DefinitionsSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search constraints"
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
        <RefreshButton
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          loading={isFetching}
        />
      </DefinitionsHeader>

      <DefinitionsGrid loading={isPending}>
        {filteredConstraints.length === 0 && (
          <DefinitionsEmptyState
            title="No constraints found"
            description="This schema doesn't have any constraints matching your filter."
          />
        )}

        {filteredConstraints.map(item => (
          <MotionCard
            key={`${item.schema}-${item.table}-${item.name}-${item.column}`}
            layout
            {...MOTION_BLOCK_PROPS}
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
                    mt-2 flex items-center gap-2 text-sm text-muted-foreground
                  `}
                  >
                    <Badge variant="outline" className="text-xs font-normal">
                      <RiTable2 className="mr-1 size-3" />
                      {item.table}
                    </Badge>
                    {item.column && (
                      <span className="flex items-center gap-2">
                        <span>on</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.column}
                        </Badge>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            {item.type === 'foreignKey' && (
              <CardContent className="border-t bg-muted/10 px-4 py-3 text-sm">
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
      </DefinitionsGrid>
    </>
  )
}
