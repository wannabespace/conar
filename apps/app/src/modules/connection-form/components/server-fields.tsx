import { DEFAULT_PORTS } from '@tamery/connection/connection-parts'
import { isLocalHost } from '@tamery/connection/hosts'
import {
  ConnectionType,
  connectionTypeLabels,
  dialectOf,
  SqlDialect,
} from '@tamery/shared/enums/connection-type'
import { FieldGroup } from '@tamery/ui/components/field'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { SelectItem } from '@tamery/ui/components/select'
import { useSelector } from '@tanstack/react-form'

import { useLocalProxyAvailable } from '~/core/runtime/proxy'

import type { ConnectionForm } from '../lib/connection-form'
import { Footnote } from './footnote'
import { TextRow } from './text-row'

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

const USER_PLACEHOLDERS: Record<SqlDialect, string> = {
  [SqlDialect.ClickHouse]: 'default',
  [SqlDialect.MSSQL]: 'e.g. sa',
  [SqlDialect.MySQL]: 'e.g. root',
  [SqlDialect.Postgres]: 'e.g. postgres',
}

const DATABASE_PLACEHOLDERS: Record<SqlDialect, string> = {
  [SqlDialect.ClickHouse]: 'default',
  [SqlDialect.MSSQL]: 'master',
  [SqlDialect.MySQL]: 'Optional',
  [SqlDialect.Postgres]: 'postgres',
}

const OPTIONS_PLACEHOLDERS: Partial<Record<SqlDialect, string>> = {
  [SqlDialect.MSSQL]: 'e.g. encrypt=true',
  [SqlDialect.MySQL]: 'e.g. ssl=true',
  [SqlDialect.Postgres]: 'e.g. sslmode=require',
}

export const ServerFields = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => {
  const type = useSelector(form.store, (state) => state.values.type)
  const dialect = dialectOf(type)
  const isLocal = useSelector(form.store, (state) =>
    isLocalHost(state.values.host.trim())
  )
  const localProxyAvailable = useLocalProxyAvailable()
  const row = { form, locked }

  return (
    <>
      <FieldGroup variant="card">
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
        <TextRow
          {...row}
          label="Host"
          name="host"
          placeholder="db.example.com or any connection string"
          port={{
            label: 'Port',
            name: 'port',
            placeholder: String(DEFAULT_PORTS[type]),
          }}
        />
        <TextRow
          {...row}
          label="User"
          name="user"
          placeholder={USER_PLACEHOLDERS[dialect]}
        />
        <TextRow
          {...row}
          label="Password"
          name="password"
          placeholder="None"
          secret
          autoComplete="new-password"
        />
        <TextRow
          {...row}
          label="Database"
          name="database"
          placeholder={DATABASE_PLACEHOLDERS[dialect]}
        />
        <TextRow
          {...row}
          label="Options"
          name="options"
          placeholder={OPTIONS_PLACEHOLDERS[dialect]}
        />
      </FieldGroup>
      {isLocal && !window.electron && localProxyAvailable && (
        <Footnote>
          Local databases are reached through your tamery proxy.
        </Footnote>
      )}
    </>
  )
}
