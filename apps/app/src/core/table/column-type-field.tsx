import {
  Autocomplete,
  ComboboxCollection,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from '@tamery/ui/components/combobox'
import { Field, FieldError, FieldLabel } from '@tamery/ui/components/field'
import { InputGroupAddon } from '@tamery/ui/components/input-group'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import type { ArrayType } from '~/core/catalog/capabilities'
import { capabilitiesOf, defaultSchemaOf } from '~/core/catalog/capabilities'
import { quoteIdentifier } from '~/core/codegen/utils'
import { resourceEnumsQueryOptions } from '~/core/queries/enums/list'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

interface ColumnTypeGroup {
  items: readonly string[]
  label: string
}

export const arrayTypes = {
  join: (arrayType: ArrayType | null, array: boolean, element: string) =>
    arrayType && array && element
      ? `${arrayType.open}${element}${arrayType.close}`
      : element,
  split: (arrayType: ArrayType | null, type: string) => {
    const array =
      !!arrayType &&
      type.length > arrayType.open.length + arrayType.close.length &&
      type.startsWith(arrayType.open) &&
      type.endsWith(arrayType.close)
    return {
      array,
      element: array
        ? type.slice(arrayType.open.length, -arrayType.close.length)
        : type,
    }
  },
}

const bareIdentifierRegex = /^[a-z_][a-z0-9_]*$/u

const useColumnTypes = () => {
  const { connection, connectionResource } = useRouteContext()
  const { data: enums = [] } = useQuery({
    ...resourceEnumsQueryOptions({ connectionResource }),
    throwOnError: false,
  })
  const defaultSchema = defaultSchemaOf(
    connection.type,
    connectionResource.name
  )
  const identifier = (name: string) =>
    bareIdentifierRegex.test(name)
      ? name
      : quoteIdentifier(name, connection.type)
  // MySQL and ClickHouse enums are inline column types (they carry metadata), not named types.
  const namedEnums = enums
    .filter((enumType) => !enumType.metadata)
    .map((enumType) =>
      enumType.schema === defaultSchema
        ? identifier(enumType.name)
        : `${identifier(enumType.schema)}.${identifier(enumType.name)}`
    )
  const groups: ColumnTypeGroup[] = [
    { items: namedEnums, label: 'Enums' },
    {
      items: capabilitiesOf(connection.type).columnTypes.options,
      label: 'Types',
    },
  ]
  return groups.filter((group) => group.items.length > 0)
}

export const TypeField = ({
  autoFocus,
  error,
  onValueChange,
  value,
}: {
  autoFocus: boolean
  error: string | undefined
  onValueChange: (value: string) => void
  value: string
}) => {
  const columnTypes = useColumnTypes()
  const [open, setOpen] = useState(false)

  return (
    <Field>
      <FieldLabel htmlFor="column-dialog-type">Type</FieldLabel>
      <Autocomplete
        items={columnTypes}
        value={value}
        onValueChange={onValueChange}
        open={open}
        onOpenChange={setOpen}
        openOnInputClick
      >
        <ComboboxInput
          id="column-dialog-type"
          onFocus={() => setOpen(true)}
          aria-invalid={!!error}
          autoFocus={autoFocus}
          spellCheck={false}
          autoComplete="off"
          placeholder="integer, varchar(255)…"
          className="w-full"
          data-mask
        >
          {error && (
            <InputGroupAddon align="inline-end">
              <FieldError>{error}</FieldError>
            </InputGroupAddon>
          )}
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxList>
            {(group: ColumnTypeGroup) => (
              <ComboboxGroup key={group.label} items={group.items}>
                {columnTypes.length > 1 && (
                  <ComboboxLabel>{group.label}</ComboboxLabel>
                )}
                <ComboboxCollection>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Autocomplete>
    </Field>
  )
}
