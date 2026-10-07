import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@tamery/ui/components/combobox'
import { Field, FieldLabel } from '@tamery/ui/components/field'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { foreignKeysCreatable } from '~/core/catalog/capabilities'

import type { ReferenceTarget } from './use-reference-targets'
import { useReferenceTargets } from './use-reference-targets'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const ReferenceField = ({
  column,
  onValueChange,
  value,
}: {
  column: { foreign: boolean } | null
  onValueChange: (target: ReferenceTarget | null) => void
  value: ReferenceTarget | null
}) => {
  const { connection } = useRouteContext()
  const referable = foreignKeysCreatable(connection.type) && !column?.foreign
  const [opened, setOpened] = useState(false)
  const { loading, targets } = useReferenceTargets(referable && opened)
  const labels = [...targets.keys()].toSorted()

  if (!referable) {
    return null
  }

  return (
    <Field>
      <FieldLabel htmlFor="column-dialog-reference">References</FieldLabel>
      <Combobox
        items={labels}
        value={value?.label ?? null}
        onValueChange={(label: string | null) =>
          onValueChange((label && targets.get(label)) || null)
        }
        onOpenChange={(open) => {
          if (open) {
            setOpened(true)
          }
        }}
        autoHighlight
      >
        <ComboboxInput
          id="column-dialog-reference"
          placeholder="No foreign key"
          className="w-full"
          showClear={value !== null}
          spellCheck={false}
          autoComplete="off"
          data-mask
        />
        <ComboboxContent data-mask>
          <ComboboxEmpty>
            {loading ? 'Loading keys…' : 'No keys to reference.'}
          </ComboboxEmpty>
          <ComboboxList>
            {(label: string) => (
              <ComboboxItem key={label} value={label}>
                {label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  )
}
