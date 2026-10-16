import type { SqliteLocation } from '@tamery/connection/sqlite-remote'
import { FieldGroup } from '@tamery/ui/components/field'

import type { ConnectionForm } from '../lib/connection-form'
import { EngineField } from './engine-field'
import { TextRow } from './text-row'

export const RemoteSqliteFields = ({
  form,
  locked,
  sqliteLocation,
}: {
  form: ConnectionForm
  locked: (field: string) => boolean
  sqliteLocation: Exclude<SqliteLocation, 'file'>
}) => {
  const row = { form, locked }

  return (
    <FieldGroup variant="card">
      <EngineField form={form} locked={locked} />
      {sqliteLocation === 'libsql' ? (
        <>
          <TextRow
            {...row}
            label="Host"
            name="host"
            placeholder="my-db-org.turso.io or its libsql:// URL"
          />
          <TextRow
            {...row}
            label="Auth token"
            name="password"
            placeholder="None"
            secret
            autoComplete="new-password"
          />
        </>
      ) : (
        <>
          <TextRow
            {...row}
            label="Account ID"
            name="user"
            placeholder="In the dashboard URL, after dash.cloudflare.com/"
          />
          <TextRow
            {...row}
            label="Database ID"
            name="database"
            placeholder="Or paste the database's dashboard link"
          />
          <TextRow
            {...row}
            label="API token"
            name="password"
            placeholder="With D1 Edit permission"
            secret
            autoComplete="new-password"
          />
        </>
      )}
    </FieldGroup>
  )
}
