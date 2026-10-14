import { LABEL_OPTIONS } from '@tamery/shared/constants'
import {
  Autocomplete,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@tamery/ui/components/combobox'
import { eq, useLiveQuery } from '@tanstack/react-db'

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
  const labels = [
    ...new Set([
      ...LABEL_OPTIONS,
      ...connections.flatMap((connection) =>
        connection.label ? [connection.label] : []
      ),
    ]),
  ].toSorted()

  return (
    <form.AppField name="label">
      {(field) => (
        <field.Field orientation="row">
          <field.Label>Label</field.Label>
          <Autocomplete
            items={labels}
            value={field.state.value}
            onValueChange={(next) => field.handleChange(next)}
          >
            <ComboboxInput
              id={field.name}
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
        </field.Field>
      )}
    </form.AppField>
  )
}
