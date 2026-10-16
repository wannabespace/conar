import {
  ConnectionType,
  connectionTypeLabels,
} from '@tamery/shared/enums/connection-type'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { SelectItem } from '@tamery/ui/components/select'

import type { ConnectionForm } from '../lib/connection-form'

const TYPES = Object.values(ConnectionType).map((type) => ({
  label: connectionTypeLabels[type],
  value: type,
}))

const typeLabel = (type: ConnectionType) => (
  <>
    <ConnectionIcon type={type} />
    {connectionTypeLabels[type]}
  </>
)

export const EngineField = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => (
  <form.AppField name="type">
    {(field) => (
      <field.Field orientation="row">
        <field.Label>Engine</field.Label>
        <field.Select
          items={TYPES}
          disabled={locked(field.name)}
          variant="flat"
          renderValue={typeLabel}
        >
          {TYPES.map(({ value }) => (
            <SelectItem key={value} value={value}>
              {typeLabel(value)}
            </SelectItem>
          ))}
        </field.Select>
      </field.Field>
    )}
  </form.AppField>
)
