import { ConnectionType } from '@conar/shared/enums/connection-type'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardTitle } from '@conar/ui/components/card'
import { CardMotion } from '@conar/ui/components/card.motion'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { cn } from '@conar/ui/lib/utils'
import { RiLayoutColumnLine, RiListIndefinite, RiListUnordered, RiTable2 } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { resourceEnumsQueryOptions } from '~/entities/connection/queries'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { SchemaSelect } from '../-components/schema-select'
import { MOTION_BLOCK_PROPS } from '../-constants'
import { useDefinitionsState } from '../-hooks/use-definitions-state'

export const Route = createFileRoute('/_protected/connection/$resourceId/definitions/enums/')({
  component: DatabaseEnumsPage,
  loader: ({ context }) => ({ connection: context.connection, connectionResource: context.connectionResource }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Enums', loaderData.connection.name, loaderData.connectionResource.name) }] : [],
  }),
})

function DatabaseEnumsPage() {
  const { connection, connectionResource } = Route.useRouteContext()
  const { data: enums, refetch, isFetching, isPending, dataUpdatedAt } = useQuery(resourceEnumsQueryOptions({ connectionResource }))
  const { schemas, selectedSchema, setSelectedSchema, search, setSearch } = useDefinitionsState({ connectionResource })

  useRefreshHotkey(refetch, isFetching)

  const filteredEnums = enums
    ?.filter(enumItem =>
      enumItem.schema === selectedSchema
      && (!search
        || enumItem.name.toLowerCase().includes(search.toLowerCase())
        || enumItem.values.some(value => value.toLowerCase().includes(search.toLowerCase()))
        || (!!enumItem.metadata?.table && enumItem.metadata.table.toLowerCase().includes(search.toLowerCase()))
        || (!!enumItem.metadata?.column && enumItem.metadata.column.toLowerCase().includes(search.toLowerCase()))
      ),
    )
    .map(enumItem => ({
      ...enumItem,
      values: enumItem.values.filter(value => value.toLowerCase().includes(search.toLowerCase())),
    })) ?? []

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
        <SchemaSelect schemas={schemas} selectedSchema={selectedSchema} setSelectedSchema={setSelectedSchema} />
      </div>
      <DefinitionsGrid loading={isPending}>
        {filteredEnums.length === 0 && (
          <DefinitionsEmptyState
            title="No enums found"
            description="This schema doesn't have any enums defined yet."
          />
        )}

        {filteredEnums.map(enumItem => (
          <CardMotion
            key={`${enumItem.schema}-${enumItem.name}-${enumItem.metadata?.table ?? ''}-${enumItem.metadata?.column ?? ''}`}
            layout
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
          </CardMotion>
        ))}
      </DefinitionsGrid>
    </>
  )
}
