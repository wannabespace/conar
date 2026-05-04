import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'

export function SchemaSelect({ schemas, selectedSchema, setSelectedSchema }: {
  schemas: string[]
  selectedSchema: string | undefined
  setSelectedSchema: (schema: string) => void
}) {
  if (schemas.length <= 1)
    return null

  return (
    <Select
      value={selectedSchema}
      onValueChange={(v) => {
        if (v) {
          setSelectedSchema(v)
        }
      }}
    >
      <SelectTrigger className="max-w-56 min-w-45">
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <span className="shrink-0 text-muted-foreground">schema</span>
          <span className="truncate"><SelectValue /></span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {schemas.map(schema => (
          <SelectItem key={schema} value={schema}>{schema}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
