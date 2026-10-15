import type { Engine } from '@tamery/shared/enums/connection-type'
import { engineLabels, engines } from '@tamery/shared/enums/connection-type'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { SelectItem } from '@tamery/ui/components/select'

import type { ConnectionForm } from '../lib/connection-form'

const ENGINES = engines.all.map((engine) => ({
  label: engineLabels[engine],
  value: engine,
}))

const engineLabel = (engine: Engine) => (
  <>
    <ConnectionIcon engine={engine} />
    {engineLabels[engine]}
  </>
)

export const EngineField = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => (
  <form.AppField name="engine">
    {(field) => (
      <field.Field orientation="row">
        <field.Label>Engine</field.Label>
        <field.Select
          items={ENGINES}
          disabled={locked(field.name)}
          variant="flat"
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
