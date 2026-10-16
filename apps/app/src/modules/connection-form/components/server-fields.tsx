import { FolderOpenIcon } from '@hugeicons/core-free-icons'
import { DEFAULT_PORTS } from '@tamery/connection/connection-parts'
import { isLocalHost } from '@tamery/connection/hosts'
import {
  ConnectionType,
  connectionTypeLabels,
  getDialect,
  Dialect,
} from '@tamery/shared/enums/connection-type'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import { FieldGroup } from '@tamery/ui/components/field'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { SelectItem } from '@tamery/ui/components/select'
import { useSelector } from '@tanstack/react-form'

import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { posthog } from '~/lib/posthog'

import type { ConnectionForm } from '../lib/connection-form'
import { opensFile } from '../lib/connection-form'
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
        {opensFile(type) ? (
          <TextRow
            {...row}
            label="File"
            name="database"
            placeholder="/path/to/app.db"
          >
            {window.electron && (
              <IconButton
                variant="ghost-faint"
                size="icon-sm"
                icon={FolderOpenIcon}
                label="Choose file"
                disabled={locked('database')}
                onClick={async () => {
                  const path = await window.electron?.sqlite.pickFile()
                  if (path) {
                    posthog.capture('connection_file_picked')
                    form.setFieldValue('database', path)
                  }
                }}
              />
            )}
          </TextRow>
        ) : (
          <>
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
          </>
        )}
      </FieldGroup>
      {opensFile(type) && !window.electron && (
        <Footnote>
          The file opens on the computer running your tamery proxy.
        </Footnote>
      )}
      {!opensFile(type) &&
        isLocal &&
        !window.electron &&
        localProxyAvailable && (
          <Footnote>
            Local databases are reached through your tamery proxy.
          </Footnote>
        )}
    </>
  )
}
