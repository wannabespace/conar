import {
  connectionLabels,
  ConnectionType,
} from '@tamery/shared/enums/connection-type'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { SelectItem } from '@tamery/ui/components/select'

import type { ConnectionForm } from '../lib/connection-form'

const ENGINES = Object.values(ConnectionType).map((type) => ({
  label: connectionLabels[type],
  value: type,
}))

const engineLabel = (type: ConnectionType) => (
  <>
    <ConnectionIcon type={type} />
    {connectionLabels[type]}
  </>
)

export const EngineField = ({ form }: { form: ConnectionForm }) => (
  <form.AppField name="type">
    {(field) => (
      <field.Field orientation="row">
        <field.Label>Engine</field.Label>
        <field.Select
          items={ENGINES}
          variant="flat"
          className="flex-1"
          renderValue={engineLabel}
        >
          {ENGINES.map(({ value }) => (
            <SelectItem key={value} value={value}>
              {engineLabel(value)}
            </SelectItem>
          ))}
        </field.Select>
      </field.Field>
    )}
  </form.AppField>
)
