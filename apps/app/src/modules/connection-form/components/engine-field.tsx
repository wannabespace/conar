import type { SqliteLocation } from '@tamery/shared/enums/connection-type'
import {
  ConnectionType,
  connectionTypeLabels,
  sqliteLocationLabels,
} from '@tamery/shared/enums/connection-type'
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

/** Turso and D1 are SQLite in another place, so one engine choice writes both the type and the SQLite location. */
type EngineKey = Exclude<ConnectionType, ConnectionType.SQLite> | SqliteLocation

const SQLITE_LOCATIONS: SqliteLocation[] = ['file', 'libsql', 'd1']

const isSqliteLocation = (key: EngineKey): key is SqliteLocation =>
  Object.hasOwn(sqliteLocationLabels, key)

const getEngineName = (key: EngineKey) =>
  isSqliteLocation(key) ? sqliteLocationLabels[key] : connectionTypeLabels[key]

const ENGINES = Object.values(ConnectionType)
  .flatMap<EngineKey>((type) =>
    type === ConnectionType.SQLite ? SQLITE_LOCATIONS : [type]
  )
  .map((key) => ({ label: getEngineName(key), value: key }))

const engineLabel = (key: EngineKey) => (
  <>
    {isSqliteLocation(key) ? (
      <ConnectionIcon type={ConnectionType.SQLite} sqliteLocation={key} />
    ) : (
      <ConnectionIcon type={key} />
    )}
    {getEngineName(key)}
  </>
)

export const EngineField = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => {
  const engine = useSelector(
    form.store,
    ({ values: { sqliteLocation, type } }): EngineKey =>
      type === ConnectionType.SQLite ? sqliteLocation : type
  )

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
              if (key === null) {
                return
              }
              const next = isSqliteLocation(key)
                ? { sqliteLocation: key, type: ConnectionType.SQLite }
                : { sqliteLocation: 'file' as const, type: key }
              if (getPlace(next) !== getPlace(form.state.values)) {
                clearPlace(form)
              }
              field.handleChange(next.type)
              form.setFieldValue('sqliteLocation', next.sqliteLocation)
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
