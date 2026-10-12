import { LABEL_OPTIONS } from '@tamery/shared/constants'
import {
  Autocomplete,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@tamery/ui/components/combobox'
import { Field, FieldLabel } from '@tamery/ui/components/field'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useStore } from '@tanstack/react-form'

import { useCollections } from '~/core/collections'
import { useActiveWorkspace } from '~/core/workspace/hooks'

import type { ConnectionForm } from '../-lib/connection-form'

export const LabelField = ({ form }: { form: ConnectionForm }) => {
  const { connectionsCollection } = useCollections()
  const { data: activeWorkspace } = useActiveWorkspace()
  const { data: connections } = useLiveQuery({
    query: (q) =>
      q
        .from({ connections: connectionsCollection })
        .where(({ connections: row }) =>
          eq(row.workspaceId, activeWorkspace?.id ?? '')
        ),
  })
  const label = useStore(form.store, (state) => state.values.label)
  const labels = [
    ...new Set([
      ...LABEL_OPTIONS,
      ...connections.flatMap((connection) =>
        connection.label ? [connection.label] : []
      ),
    ]),
  ].toSorted()

  return (
    <Field orientation="row">
      <FieldLabel htmlFor="label">Label</FieldLabel>
      <Autocomplete
        items={labels}
        value={label}
        onValueChange={(next) => form.setFieldValue('label', next)}
      >
        <ComboboxInput
          id="label"
          variant="inset"
          className="flex-1"
          data-mask
          autoComplete="off"
          placeholder="None"
        />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item} data-mask>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Autocomplete>
    </Field>
  )
}
