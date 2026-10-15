import { DEFAULT_PORTS } from '@tamery/connection/connection-parts'
import { isLocalHost } from '@tamery/connection/hosts'
import { ConnectionType, engines } from '@tamery/shared/enums/connection-type'
import { FieldGroup } from '@tamery/ui/components/field'
import { useSelector } from '@tanstack/react-form'

import { useLocalProxyAvailable } from '~/core/runtime/proxy'

import type { ConnectionForm } from '../lib/connection-form'
import { EngineField } from './engine-field'
import { Footnote } from './footnote'
import { TextRow } from './text-row'

const USER_PLACEHOLDERS: Record<ConnectionType, string> = {
  [ConnectionType.ClickHouse]: 'default',
  [ConnectionType.MSSQL]: 'e.g. sa',
  [ConnectionType.MySQL]: 'e.g. root',
  [ConnectionType.Postgres]: 'e.g. postgres',
}

const DATABASE_PLACEHOLDERS: Record<ConnectionType, string> = {
  [ConnectionType.ClickHouse]: 'default',
  [ConnectionType.MSSQL]: 'master',
  [ConnectionType.MySQL]: 'Optional',
  [ConnectionType.Postgres]: 'postgres',
}

const OPTIONS_PLACEHOLDERS: Partial<Record<ConnectionType, string>> = {
  [ConnectionType.MSSQL]: 'e.g. encrypt=true',
  [ConnectionType.MySQL]: 'e.g. ssl=true',
  [ConnectionType.Postgres]: 'e.g. sslmode=require',
}

export const ServerFields = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
}) => {
  const type = useSelector(form.store, (state) =>
    engines.type(state.values.engine)
  )
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
          placeholder={USER_PLACEHOLDERS[type]}
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
          placeholder={DATABASE_PLACEHOLDERS[type]}
        />
        <TextRow
          {...row}
          label="Options"
          name="options"
          placeholder={OPTIONS_PLACEHOLDERS[type]}
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
