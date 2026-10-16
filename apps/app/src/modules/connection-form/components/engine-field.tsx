import { engines } from '@tamery/shared/enums/connection-type'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { useSelector } from '@tanstack/react-form'

import type { ConnectionForm } from '../lib/connection-form'
import { clearPlace } from '../lib/connection-form'
import { getPlace } from '../lib/place'

type Engine = (typeof engines)[number]

const EngineLabel = ({ label, provider, type }: Engine) => (
  <>
    <ConnectionIcon type={type} provider={provider} />
    {label}
  </>
)

export const EngineField = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => {
  const engine = useSelector(form.store, ({ values }) =>
    engines.find(
      ({ provider, type }) =>
        type === values.type && provider === values.provider
    )
  )

  return (
    <form.AppField name="type">
      {(field) => (
        <field.Field orientation="row">
          <field.Label>Engine</field.Label>
          <Select<Engine>
            disabled={locked(field.name)}
            value={engine}
            onValueChange={(next) => {
              if (!next) {
                return
              }
              if (getPlace(next) !== getPlace(form.state.values)) {
                clearPlace(form)
              }
              field.handleChange(next.type)
              form.setFieldValue('provider', next.provider)
            }}
          >
            <SelectTrigger
              id={field.name}
              // The trigger is a div, which `<label for>` cannot name.
              aria-labelledby={`${field.name}-label`}
              variant="flat"
              onBlur={field.handleBlur}
            >
              <SelectValue>
                {(value: Engine) => <EngineLabel {...value} />}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {engines.map((item) => (
                <SelectItem key={item.label} value={item}>
                  <EngineLabel {...item} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </field.Field>
      )}
    </form.AppField>
  )
}
