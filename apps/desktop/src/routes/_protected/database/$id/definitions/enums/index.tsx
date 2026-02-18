import { ConnectionType } from '@conar/shared/enums/connection-type'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardTitle, MotionCard } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { cn } from '@conar/ui/lib/utils'
import { RiLayoutColumnLine, RiListIndefinite, RiListUnordered, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useConnectionEnums, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { connectionStore } from '~/entities/connection/store'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsHeader } from '../-components/header'
import { VirtualDefinitionsGrid } from '../-components/virtual-grid'
import { MOTION_BLOCK_PROPS } from '../-constants'

export const Route = createFileRoute('/_protected/database/$id/definitions/enums/')({
  component: DatabaseEnumsPage,
  loader: ({ context }) => ({ connection: context.connection }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Enums', loaderData.connection.name) }] : [],
  }),
})

function DatabaseEnumsPage() {
  const { connection } = Route.useLoaderData()
  const { data: enums, refetch, isFetching, isPending, dataUpdatedAt } = useConnectionEnums({ connection })
  const store = connectionStore(connection.id)
  const showSystem = useStore(store, state => state.showSystem)
  const { data } = useConnectionTablesAndSchemas({ connection, showSystem })
  const schemas = useMemo(() => data?.schemas.map(({ name }) => name) ?? [], [data])
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema))) {
      setSelectedSchema(schemas[0])
    }
  }, [schemas, selectedSchema])

  const filteredEnums = useMemo(() => {
    if (!enums)
      return []

    const lowerSearch = search?.trim().toLowerCase()

    return enums.reduce<typeof enums>((acc, enumItem) => {
      if (enumItem.schema !== selectedSchema)
        return acc

      if (!lowerSearch) {
        acc.push(enumItem)
        return acc
      }

      const matchesName = enumItem.name.toLowerCase().includes(lowerSearch)
      const matchesTable = !!enumItem.metadata?.table && enumItem.metadata.table.toLowerCase().includes(lowerSearch)
      const matchesColumn = !!enumItem.metadata?.column && enumItem.metadata.column.toLowerCase().includes(lowerSearch)

      if (matchesName || matchesTable || matchesColumn) {
        acc.push(enumItem)
        return acc
      }

      const matchingValues = enumItem.values.filter(value => value.toLowerCase().includes(lowerSearch))

      if (matchingValues.length > 0) {
        acc.push({
          ...enumItem,
          values: matchingValues,
        })
      }

      return acc
    }, [])
  }, [enums, search, selectedSchema])

  return (
    <>
      <DefinitionsHeader
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        dataUpdatedAt={dataUpdatedAt}
      >
        Enums
        {connection.type === ConnectionType.MySQL && ' & Sets'}
      </DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search enums"
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
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
        items={filteredEnums}
        getItemKey={item => `${item.schema}-${item.name}-${item.metadata?.table ?? ''}-${item.metadata?.column ?? ''}`}
        emptyState={(
          <DefinitionsEmptyState
            title="No enums found"
            description="This schema doesn't have any enums defined yet."
          />
        )}
        renderItem={enumItem => (
          <MotionCard
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {enumItem.metadata?.isSet
                      ? <RiListIndefinite className="size-4 text-primary" />
                      : <RiListUnordered className="size-4 text-primary" />}
                    <HighlightText text={enumItem.name} match={search} />
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      {enumItem.metadata?.isSet ? 'Set' : 'Enum'}
                    </Badge>
                  </CardTitle>
                  <div className={`
                    mt-2 flex flex-wrap items-center gap-2 text-sm
                    text-muted-foreground
                  `}
                  >
                    {enumItem.metadata?.table && (
                      <>
                        <Badge variant="outline" className="text-xs">
                          <RiTable2 className="mr-1 size-3" />
                          {enumItem.metadata.table}
                        </Badge>
                        {enumItem.metadata.column && (
                          <>
                            <span>on</span>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              <RiLayoutColumnLine className="mr-1 size-3" />
                              {enumItem.metadata.column}
                            </Badge>
                          </>
                        )}
                      </>
                    )}
                    <AnimatePresence initial={false} mode="popLayout">
                      {enumItem.values.map(value => (
                        <HighlightText
                          key={value}
                          text={value}
                          match={search}
                          render={({ html, matched }) => (
                            <motion.div layout {...MOTION_BLOCK_PROPS}>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  matched && 'border-primary/30 bg-primary/10',
                                )}
                              >
                                {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
                                <span dangerouslySetInnerHTML={{ __html: html }} />
                              </Badge>
                            </motion.div>
                          )}
                        />
                      ))}
                    </AnimatePresence>
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
