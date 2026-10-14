import { DEFAULT_PORTS } from '@tamery/connection/connection-parts'
import { isLocalHost } from '@tamery/connection/hosts'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { FieldGroup } from '@tamery/ui/components/field'
import { useStore } from '@tanstack/react-form'

import { useLocalProxyAvailable } from '~/core/runtime/proxy'

import type { ConnectionForm } from '../-lib/connection-form'
import { EngineField } from './engine-field'
import { Footnote } from './footnote'

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

export const ServerFields = ({ form }: { form: ConnectionForm }) => {
  const type = useStore(form.store, (state) => state.values.type)
  const isLocal = useStore(form.store, (state) =>
    isLocalHost(state.values.host.trim())
  )
  const localProxyAvailable = useLocalProxyAvailable()

  return (
    <>
      <FieldGroup variant="card">
        <EngineField form={form} />
        <form.AppField name="host">
          {(field) => (
            <field.Field orientation="row">
              <field.Label>Host</field.Label>
              <field.Input
                variant="inset"
                data-mask
                spellCheck={false}
                autoComplete="off"
                placeholder="db.example.com or any connection string"
              />
              <span className="text-muted-foreground">:</span>
              <form.AppField name="port">
                {(portField) => (
                  <div className="w-20 shrink-0">
                    <portField.Input
                      variant="inset"
                      aria-label="Port"
                      data-mask
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder={String(DEFAULT_PORTS[type])}
                    />
                  </div>
                )}
              </form.AppField>
            </field.Field>
          )}
        </form.AppField>
        <form.AppField name="user">
          {(field) => (
            <field.Field orientation="row">
              <field.Label>User</field.Label>
              <field.Input
                variant="inset"
                data-mask
                spellCheck={false}
                autoComplete="off"
              />
            </field.Field>
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.Field orientation="row">
              <field.Label>Password</field.Label>
              <field.PasswordInput
                variant="inset"
                data-mask
                autoComplete="new-password"
              />
            </field.Field>
          )}
        </form.AppField>
        <form.AppField name="database">
          {(field) => (
            <field.Field orientation="row">
              <field.Label>Database</field.Label>
              <field.Input
                variant="inset"
                data-mask
                spellCheck={false}
                autoComplete="off"
                placeholder={DATABASE_PLACEHOLDERS[type]}
              />
            </field.Field>
          )}
        </form.AppField>
        <form.AppField name="options">
          {(field) => (
            <field.Field orientation="row">
              <field.Label>Options</field.Label>
              <field.Input
                variant="inset"
                data-mask
                spellCheck={false}
                autoComplete="off"
                placeholder={OPTIONS_PLACEHOLDERS[type]}
              />
            </field.Field>
          )}
        </form.AppField>
      </FieldGroup>
      {isLocal && !window.electron && localProxyAvailable && (
        <Footnote>
          Local databases are reached through your tamery proxy.
        </Footnote>
      )}
    </>
  )
}
