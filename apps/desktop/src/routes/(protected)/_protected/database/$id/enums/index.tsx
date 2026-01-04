import { DatabaseType } from '@conar/shared/enums/database-type'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Input } from '@conar/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { RiCloseLine, RiDatabase2Line, RiInformationLine, RiListIndefinite, RiListUnordered, RiStackLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useDatabaseEnums, useDatabaseTablesAndSchemas } from '~/entities/database/queries'

const MotionCard = motion.create(Card)

export const Route = createFileRoute('/(protected)/_protected/database/$id/enums/')({
  component: DatabaseEnumsPage,
  loader: ({ context }) => ({ database: context.database }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title(`Enums - ${loaderData.database.name}`) }] : [],
  }),
})

function DatabaseEnumsPage() {
  const { database } = Route.useLoaderData()
  const { data: enums } = useDatabaseEnums({ database })
  const { data } = useDatabaseTablesAndSchemas({ database })
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
    <ScrollArea className="h-full rounded-lg border bg-background">
      <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Enums
            {database.type === DatabaseType.MySQL && ' & Sets'}
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <Input
                placeholder="Search enums"
                className="w-[180px] pr-8"
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
            {schemas.length > 1 && (
              <Select value={selectedSchema} onValueChange={setSelectedSchema}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      schema
                    </span>
                    <SelectValue placeholder="Select schema" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {schemas.map(schema => (
                    <SelectItem key={schema} value={schema}>
                      {schema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-4">
          <AnimatePresence initial={false} mode="popLayout">
            {filteredEnums.length === 0 && (
              <MotionCard
                layout
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.15 }}
                className={`
                  mt-4 w-full border border-dashed border-muted-foreground/20
                  bg-muted/10
                `}
              >
                <CardContent className={`
                  flex flex-col items-center justify-center p-10 text-center
                `}
                >
                  <RiInformationLine className={`
                    mx-auto mb-3 size-12 text-muted-foreground
                  `}
                  />
                  <h3 className="text-lg font-medium text-foreground">No enums found</h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    This schema doesn't have any enums defined yet.
                  </p>
                </CardContent>
              </MotionCard>
            )}
            {filteredEnums.map(enumItem => (
              <MotionCard
                key={`${enumItem.schema}-${enumItem.name}-${enumItem.metadata?.table ?? ''}-${enumItem.metadata?.column ?? ''}`}
                className={`
                  overflow-hidden border border-border/60 transition-colors
                  hover:border-border/90
                `}
                layout
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.15 }}
              >
                <CardHeader className="bg-muted/50 px-4 py-3">
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
                                <div className={`
                                  mt-1 text-xs text-muted-foreground
                                `}
                                >
                                  Used in&nbsp;
                                  <Badge
                                    variant="outline"
                                    className="mr-1 px-1 py-0.5 font-mono"
                                  >
                                    {enumItem.metadata.table}
                                  </Badge>
                                  table
                                  and
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
                                <RiDatabase2Line className={`
                                  mr-0.5 inline size-3
                                `}
                                />
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
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.75 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.75 }}
                        transition={{ duration: 0.15 }}
                      >
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
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.75 }}
                            transition={{ duration: 0.15 }}
                          >
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
          </AnimatePresence>
        </div>
      </div>
    </ScrollArea>
  )
}
