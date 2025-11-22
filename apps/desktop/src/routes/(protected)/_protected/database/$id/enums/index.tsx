import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Input } from '@conar/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiInformationLine, RiListUnordered } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useDatabaseEnums, useDatabaseTablesAndSchemas } from '~/entities/database'

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

  const filteredEnums = enums?.filter(enumItem =>
    enumItem.schema === selectedSchema
    && (!search
      || enumItem.name.toLowerCase().includes(search.toLowerCase())
      || enumItem.values.some(value => value.toLowerCase().includes(search.toLowerCase()))
    ),
  ) ?? []

  return (
    <ScrollArea className="bg-background rounded-lg border h-full">
      <div className="flex flex-col mx-auto max-w-2xl min-h-full py-6 px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Enums
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <Input
                placeholder="Search enums"
                className="pr-8 w-[180px]"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1"
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
        {filteredEnums.length
          ? (
              <div className="grid grid-cols-1 gap-4 mt-2">
                {filteredEnums.map(enumItem => (
                  <Card
                    key={`${enumItem.schema}-${enumItem.name}`}
                    className="overflow-hidden border border-border/60 hover:border-border/90 transition-colors"
                  >
                    <CardHeader className="py-3 px-4 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <RiListUnordered className="text-primary size-4" />
                          <CardTitle className="text-base font-medium">
                            <HighlightText text={enumItem.name} match={search} />
                          </CardTitle>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs">
                                  {enumItem.schema}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                Schema name
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {enumItem.values.length}
                          {' '}
                          value
                          {enumItem.values.length === 1 ? '' : 's'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {enumItem.values.map(value => (
                          <HighlightText
                            key={value}
                            text={value}
                            match={search}
                            render={({ html, matched }) => (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'px-2.5 py-1 text-xs rounded-md hover:bg-muted/80 transition-colors',
                                  matched && 'bg-primary/10 border-primary/30',
                                )}
                              >
                                {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
                                <span dangerouslySetInnerHTML={{ __html: html }} />
                              </Badge>
                            )}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          : (
              <Card className="w-full mt-4 border border-dashed border-muted-foreground/20 bg-muted/10">
                <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                  <RiInformationLine className="size-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-foreground">No enums found</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    This schema doesn't have any enums defined yet.
                  </p>
                </CardContent>
              </Card>
            )}
      </div>
    </ScrollArea>
  )
}
