import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { EditableListItem } from '@tamery/ui/components/custom/editable-list'
import { useState } from 'react'

import type { ArrayType } from '~/core/catalog/capabilities'
import { capabilitiesOf } from '~/core/catalog/capabilities'

const arrayTypes = {
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

export const useColumnType = (
  connectionType: ConnectionType,
  declared: string
) => {
  const { array: arrayType, enum: inlineEnum } =
    capabilitiesOf(connectionType).columnTypes
  const initial = arrayTypes.split(arrayType, declared)
  const initialValues = inlineEnum?.parse(initial.element)
  const [element, setElement] = useState(
    initialValues && inlineEnum ? inlineEnum.keyword : initial.element
  )
  // A loaded value's id is its catalog value, read back as its origin so a
  // renamed value keeps its stored number (ClickHouse) and its rows (MySQL).
  const [values, setValues] = useState<EditableListItem[]>(
    (initialValues ?? []).map((value) => ({ id: value, value }))
  )
  const [array, setArray] = useState(initial.array)
  const enumEntries =
    inlineEnum &&
    element.trim().toLowerCase() === inlineEnum.keyword.toLowerCase()
      ? values.map(({ id, value }) => ({
          origin: initialValues?.includes(id) ? id : undefined,
          value,
        }))
      : null
  const spelled =
    inlineEnum && enumEntries
      ? inlineEnum.spell(enumEntries, initial.element)
      : element.trim()

  return {
    array,
    arrayType,
    element,
    enumValues: enumEntries?.map((entry) => entry.value) ?? null,
    renamedValues: (enumEntries ?? []).flatMap(({ origin, value }) =>
      origin === undefined || origin === value
        ? []
        : [{ from: origin, to: value }]
    ),
    setArray,
    setElement,
    setValues,
    type: arrayTypes.join(arrayType, array, spelled),
    values,
  }
}
