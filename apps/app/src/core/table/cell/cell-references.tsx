import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@tamery/ui/components/tabs'

import { ReferenceTable } from './reference-table'
import type { Column } from './utils'

export const TableCellReferences = ({
  references,
  value,
}: {
  references: NonNullable<Column['references']>
  value: unknown
}) => {
  const firstSchema = references[0]?.schema
  const showSchemas =
    firstSchema !== undefined &&
    references.some((reference) => reference.schema !== firstSchema)

  return (
    <Tabs defaultValue={references?.[0]?.name} gap="none" className="size-full">
      <ScrollArea className="bg-muted/50">
        <TabsList variant="ghost" className="h-8 w-full justify-start">
          {references.map((reference) => (
            <TabsTrigger
              key={reference.name}
              value={reference.name}
              className="flex-1"
              data-mask
            >
              {showSchemas && `${reference.schema}.`}
              {reference.table}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollArea>
      {references.map((reference) => (
        <TabsContent
          key={reference.name}
          value={reference.name}
          className="h-[calc(100%-(--spacing(8)))] w-full"
        >
          <ReferenceTable
            schema={reference.schema}
            table={reference.table}
            column={reference.column}
            value={value}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
