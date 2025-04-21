import { title } from '@connnect/shared/utils/title'
import { Badge } from '@connnect/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { Separator } from '@connnect/ui/components/separator'
import { RiInformationLine } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useDatabase, useDatabaseEnums, useDatabaseSchemas } from '~/entities/database'

export const Route = createFileRoute('/(protected)/_protected/database/$id/enums/')({
  component: DashboardPage,
  head: () => ({
    meta: [
      {
        title: title('Enums'),
      },
    ],
  }),
})

function DashboardPage() {
  const { id } = Route.useParams()
  const { data: database } = useDatabase(id)
  const [selectedSchema, setSelectedSchema] = useState('public')
  const { data: enums } = useDatabaseEnums(database)
  const { data: schemas } = useDatabaseSchemas(database)

  const filteredEnums = enums.filter(enumItem => enumItem.schema === selectedSchema)

  return (
    <div className="flex flex-col w-full mx-auto max-w-2xl py-6 px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          Enums
        </h2>
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
            {schemas?.map(schema => (
              <SelectItem key={schema.name} value={schema.name}>
                {schema.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filteredEnums.length
        ? (
            <div className="grid grid-cols-1 gap-3 mt-2">
              {filteredEnums.map(enumItem => (
                <Card
                  key={`${enumItem.schema}-${enumItem.name}`}
                  className="rounded-md"
                >
                  <CardHeader className="py-2 px-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">{enumItem.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {enumItem.schema}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="py-2 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {enumItem.values.map(value => (
                        <Badge
                          key={value}
                          variant="secondary"
                          className="px-2 py-0.5 text-xs rounded hover:bg-secondary/80 transition-colors"
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        : (
            <Card className="w-full mt-4 border border-dashed border-muted-foreground/20 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <RiInformationLine className="size-12 mx-auto mb-3 opacity-90 text-muted-foreground/80" />
                <h3 className="text-lg font-medium text-foreground/90">No enums found</h3>
                <p className="text-muted-foreground/80 text-sm max-w-md">
                  This schema doesn't have any enums defined yet.
                </p>
              </CardContent>
            </Card>
          )}
    </div>
  )
}
