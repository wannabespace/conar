import { DEFAULT_PORTS } from '@tamery/connection/connection-parts'
import { isLocalHost } from '@tamery/connection/hosts'
import { getDialect, Dialect } from '@tamery/shared/enums/connection-type'
import { FieldGroup } from '@tamery/ui/components/field'
import { useSelector } from '@tanstack/react-form'

import { useLocalProxyAvailable } from '~/core/runtime/proxy'

import type { ConnectionForm } from '../lib/connection-form'
import { EngineField } from './engine-field'
import { Footnote } from './footnote'
import { TextRow } from './text-row'

const USER_PLACEHOLDERS: Partial<Record<Dialect, string>> = {
  [Dialect.ClickHouse]: 'default',
  [Dialect.MSSQL]: 'e.g. sa',
  [Dialect.MySQL]: 'e.g. root',
  [Dialect.Postgres]: 'e.g. postgres',
}

const DATABASE_PLACEHOLDERS: Partial<Record<Dialect, string>> = {
  [Dialect.ClickHouse]: 'default',
  [Dialect.MSSQL]: 'master',
  [Dialect.MySQL]: 'Optional',
  [Dialect.Postgres]: 'postgres',
}

const OPTIONS_PLACEHOLDERS: Partial<Record<Dialect, string>> = {
  [Dialect.MSSQL]: 'e.g. encrypt=true',
  [Dialect.MySQL]: 'e.g. ssl=true',
  [Dialect.Postgres]: 'e.g. sslmode=require',
}

export const ServerFields = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => {
  const type = useSelector(form.store, (state) => state.values.type)
  const dialect = getDialect(type)
  const isLocal = useSelector(form.store, (state) =>
    isLocalHost(state.values.host.trim())
  )
  const localProxyAvailable = useLocalProxyAvailable()
  const row = { form, locked }

  return (
    <>
      <FieldGroup variant="card">
        <EngineField form={form} locked={locked} />
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
