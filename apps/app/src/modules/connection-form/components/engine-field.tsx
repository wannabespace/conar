import type {
  ConnectionType,
  Provider,
} from '@tamery/shared/enums/connection-type'
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

const getEngineKey = ({
  provider,
  type,
}: {
  provider: Provider | null
  type: ConnectionType
}) => provider ?? type

type EngineKey = ReturnType<typeof getEngineKey>

const ENGINES = engines.map((engine) => ({
  ...engine,
  value: getEngineKey(engine),
}))

const findEngine = (key: EngineKey | null) =>
  ENGINES.find(({ value }) => value === key)

const engineLabel = (key: EngineKey) => {
  const engine = findEngine(key)
  return (
    engine && (
      <>
        <ConnectionIcon type={engine.type} provider={engine.provider} />
        {engine.label}
      </>
    )
  )
}

export const EngineField = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => {
  const engine = useSelector(form.store, ({ values }) => getEngineKey(values))

  return (
    <form.AppField name="type">
      {(field) => (
        <field.Field orientation="row">
          <field.Label>Engine</field.Label>
          <Select<EngineKey>
            items={ENGINES}
            disabled={locked(field.name)}
            value={engine}
            onValueChange={(key) => {
              const next = findEngine(key)
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
              <SelectValue>{engineLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ENGINES.map(({ value }) => (
                <SelectItem key={value} value={value}>
                  {engineLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </field.Field>
      )}
    </form.AppField>
  )
}
