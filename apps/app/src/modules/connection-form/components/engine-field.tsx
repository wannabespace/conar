import type { SqliteLocation } from '@tamery/connection/sqlite-remote'
import {
  ConnectionType,
  connectionTypeLabels,
} from '@tamery/shared/enums/connection-type'
import { CloudflareD1Icon } from '@tamery/ui/components/icons/cloudflare-d1'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { TursoIcon } from '@tamery/ui/components/icons/turso'
import { SelectItem } from '@tamery/ui/components/select'
import { useSelector } from '@tanstack/react-form'
import type { ReactNode } from 'react'

import type { ConnectionForm } from '../lib/connection-form'

/** Turso and D1 are SQLite in another place: one engine choice writes both the type and the SQLite location. */
interface Engine {
  icon: ReactNode
  label: string
  sqliteLocation: SqliteLocation
  type: ConnectionType
  value: string
}

const ENGINES: Engine[] = Object.values(ConnectionType).flatMap((type) => {
  const engine = {
    icon: <ConnectionIcon type={type} />,
    label: connectionTypeLabels[type],
    sqliteLocation: 'file' as const,
    type,
    value: type,
  }
  return type === ConnectionType.SQLite
    ? [
        engine,
        {
          icon: <TursoIcon />,
          label: 'Turso',
          sqliteLocation: 'libsql' as const,
          type,
          value: 'turso',
        },
        {
          icon: <CloudflareD1Icon />,
          label: 'Cloudflare D1',
          sqliteLocation: 'd1' as const,
          type,
          value: 'd1',
        },
      ]
    : [engine]
})

const PLACE_FIELDS = ['database', 'host', 'password', 'port', 'user'] as const

/** A file, Turso and D1 read these fields as different things, so moving between them, or to a server, starts them over. */
const getPlace = ({
  sqliteLocation,
  type,
}: {
  sqliteLocation: SqliteLocation
  type: ConnectionType
}) => (type === ConnectionType.SQLite ? sqliteLocation : 'server')

const getEngine = (value: string) =>
  ENGINES.find((engine) => engine.value === value) ?? ENGINES[0]

const engineLabel = (value: string) => {
  const { icon, label } = getEngine(value) ?? {}
  return (
    <>
      {icon}
      {label}
    </>
  )
}

export const EngineField = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => {
  const value = useSelector(
    form.store,
    ({ values }) =>
      ENGINES.find(
        (engine) =>
          engine.type === values.type &&
          (values.type !== ConnectionType.SQLite ||
            engine.sqliteLocation === values.sqliteLocation)
      )?.value ?? values.type
  )

  return (
    <form.AppField name="type">
      {(field) => (
        <field.Field orientation="row">
          <field.Label>Engine</field.Label>
          <field.Select
            items={ENGINES}
            disabled={locked(field.name)}
            variant="flat"
            value={value}
            renderValue={engineLabel}
            onValueChange={(next) => {
              const engine = getEngine(next)
              if (!engine) {
                return
              }
              if (getPlace(form.state.values) !== getPlace(engine)) {
                for (const name of PLACE_FIELDS) {
                  form.setFieldValue(name, '')
                }
              }
              field.handleChange(engine.type)
              form.setFieldValue('sqliteLocation', engine.sqliteLocation)
            }}
          >
            {ENGINES.map((engine) => (
              <SelectItem key={engine.value} value={engine.value}>
                {engineLabel(engine.value)}
              </SelectItem>
            ))}
          </field.Select>
        </field.Field>
      )}
    </form.AppField>
  )
}
