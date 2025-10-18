import type { Column } from '../utils/table'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { TableCellTable } from './table-cell-table'

export function TableCellReferences({
  references,
  value,
}: {
  references: NonNullable<Column['references']>
  value: unknown
}) {
  const showSchemas = references.some(reference => reference.schema !== references[0]!.schema)

  return (
    <Tabs defaultValue={references?.[0]?.name} className="size-full gap-0">
      <ScrollArea className="bg-muted/50">
        <TabsList className="w-full justify-start h-8 bg-transparent">
          {references.map(reference => (
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
      {references.map(reference => (
        <TabsContent
          key={reference.name}
          value={reference.name}
          className="w-full h-[calc(100%-theme(spacing.8))]"
        >
          <TableCellTable
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
