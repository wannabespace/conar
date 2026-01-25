import { ConnectionType } from '@conar/shared/enums/connection-type'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardHeader, CardTitle, MotionCard } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { RiDatabase2Line, RiListIndefinite, RiListUnordered, RiStackLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useConnectionEnums, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
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
  const { data } = useConnectionTablesAndSchemas({ connection })
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')

  if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
    setSelectedSchema(schemas[0])

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
      <div className="flex items-center gap-2">
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
      <DefinitionsGrid loading={isPending}>
        {filteredEnums.length === 0 && (
          <DefinitionsEmptyState
            title="No enums found"
            description="This schema doesn't have any enums defined yet."
          />
        )}

        {filteredEnums.map(enumItem => (
          <MotionCard
            key={`${enumItem.schema}-${enumItem.name}-${enumItem.metadata?.table ?? ''}-${enumItem.metadata?.column ?? ''}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardHeader className="bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`
                            flex items-center gap-2 text-base font-medium
                          `}
                          >
                            {enumItem.metadata?.isSet
                              ? (
                                  <RiListIndefinite className={`
                                    size-4 text-primary
                                  `}
                                  />
                                )
                              : (
                                  <RiListUnordered className={`
                                    size-4 text-primary
                                  `}
                                  />
                                )}
                            <HighlightText text={enumItem.name} match={search} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {enumItem.metadata?.isSet ? 'Set type' : 'Enum type'}
                          {enumItem.metadata?.table && enumItem.metadata.column && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Used in&nbsp;
                              <Badge
                                variant="outline"
                                className="mr-1 px-1 py-0.5 font-mono"
                              >
                                {enumItem.metadata.table}
                              </Badge>
                              table and
                              <Badge
                                variant="outline"
                                className="ml-1 px-1 py-0.5"
                              >
                                {enumItem.metadata.column}
                              </Badge>
                              {' '}
                              column
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs">
                          <RiStackLine className="mr-0.5 inline size-3" />
                          {enumItem.schema}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Schema name
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {enumItem.metadata?.table && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs">
                            <RiTable2 className="mr-0.5 inline size-3" />
                            {enumItem.metadata.table}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Table name
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {enumItem.metadata?.column && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs">
                            <RiDatabase2Line className="mr-0.5 inline size-3" />
                            {enumItem.metadata.column}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Column name
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  <NumberFlow
                    className="tabular-nums"
                    value={enumItem.values.length}
                    suffix={` value${enumItem.values.length === 1 ? '' : 's'}`}
                  />
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 px-4 py-3">
              <AnimatePresence initial={false} mode="popLayout">
                {enumItem.values.length === 0 && (
                  <motion.div layout {...MOTION_BLOCK_PROPS}>
                    <Badge variant="outline">
                      No values found
                    </Badge>
                  </motion.div>
                )}
                {enumItem.values.map(value => (
                  <HighlightText
                    key={value}
                    text={value}
                    match={search}
                    render={({ html, matched }) => (
                      <motion.div layout {...MOTION_BLOCK_PROPS}>
                        <Badge
                          variant="outline"
                          className={cn(matched && `
                            border-primary/30 bg-primary/10
                          `)}
                        >
                          {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
                          <span dangerouslySetInnerHTML={{ __html: html }} />
                        </Badge>
                      </motion.div>
                    )}
                  />
                ))}
              </AnimatePresence>
            </CardContent>
          </MotionCard>
        ))}
      </DefinitionsGrid>
    </>
  )
}
