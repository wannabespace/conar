import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'

import type { DefinitionsState } from '../-hooks/use-definitions-state'

export const SchemaSelect = ({
  schemas,
  selectedSchema,
  setSelectedSchema,
}: Pick<
  DefinitionsState,
  'schemas' | 'selectedSchema' | 'setSelectedSchema'
>) =>
  schemas.length > 1 && (
    <Select
      value={selectedSchema}
      onValueChange={(schema) => {
        if (schema) {
          setSelectedSchema(schema)
        }
      }}
    >
      <SelectTrigger data-mask className="max-w-56 min-w-45">
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <span className="text-muted-foreground shrink-0">schema</span>
          <span className="truncate">
            <SelectValue />
          </span>
        </div>
      </SelectTrigger>
      <SelectContent data-mask>
        {schemas.map((schema) => (
          <SelectItem key={schema} value={schema}>
            {schema}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
