import { Field, FieldLabel } from '@tamery/ui/components/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'

import { NameSelect } from './pickers'

export const SchemaSelect = ({
  schemas,
  selectedSchema,
  setSelectedSchema,
}: {
  schemas: string[]
  selectedSchema: string | undefined
  setSelectedSchema: (schema: string) => void
}) => {
  if (schemas.length <= 1) {
    return null
  }

  return (
    <Select
      value={selectedSchema}
      onValueChange={(v) => {
        if (v) {
          setSelectedSchema(v)
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
}

export const SchemaField = ({
  disabled,
  id,
  onSchemaChange,
  schema,
  schemas,
}: {
  disabled: boolean
  id: string
  onSchemaChange: (schema: string) => void
  schema: string
  schemas: string[]
}) => {
  if (schemas.length <= 1) {
    return null
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>Schema</FieldLabel>
      <NameSelect
        id={id}
        disabled={disabled}
        options={schemas}
        placeholder="Choose a schema"
        value={schema}
        onValueChange={onSchemaChange}
      />
    </Field>
  )
}
