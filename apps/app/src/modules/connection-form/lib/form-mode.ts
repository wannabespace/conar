import type { SecretParam } from '@tamery/connection/secrets'
import { lowercaseKeys } from '@tamery/shared/utils'
import { getBy } from '@tanstack/react-form'

import type { ConnectionString } from '~/core/connection/connection-strings'
import type { Connection } from '~/core/connection/sync'

import type { ConnectionFormValues } from './connection-form'

export type FormMode =
  | { kind: 'create' }
  | {
      kind: 'edit'
      name: string
      passwordElsewhere: boolean
      missingSecrets: SecretParam[]
      scope: 'all' | 'credentials' | 'details'
    }

type Secret = SecretParam | 'password'

const SECRETS: Record<Secret, { field: string; message: string }> = {
  password: { field: 'password', message: 'Enter the password' },
  ssh_key: { field: 'ssh.privateKey', message: 'Paste the SSH private key' },
  ssh_passphrase: {
    field: 'ssh.passphrase',
    message: 'Enter the key passphrase',
  },
  ssh_password: { field: 'ssh.password', message: 'Enter the SSH password' },
  sslpassphrase: {
    field: 'options',
    message: 'Enter the SSL key passphrase',
  },
  sslpassword: {
    field: 'options',
    message: 'Enter the SSL key password',
  },
}

export const getEditMode = (
  connection: Pick<Connection, 'isPasswordExists' | 'name'>,
  stored: ConnectionString | undefined,
  scope: Extract<FormMode, { kind: 'edit' }>['scope']
): FormMode => ({
  kind: 'edit',
  missingSecrets: stored?.missingSecrets ?? [],
  name: connection.name,
  passwordElsewhere:
    connection.isPasswordExists && !stored?.isPasswordPopulated,
  scope,
})

export const getFormPolicy = (mode: FormMode) => {
  const scope = mode.kind === 'edit' ? mode.scope : 'all'
  const missing: Secret[] =
    mode.kind === 'edit' && scope === 'credentials'
      ? [
          ...(mode.passwordElsewhere ? ['password' as const] : []),
          ...mode.missingSecrets,
        ]
      : []
  const missingFields = missing.map((secret) => SECRETS[secret].field)
  return {
    /** `null` focuses the page itself. */
    firstField: mode.kind === 'create' ? null : (missingFields[0] ?? 'host'),
    guardsUnsaved: mode.kind === 'edit' && scope === 'all',
    locked: (field: string) =>
      scope === 'credentials' && !missingFields.includes(field),
    pasteable: scope !== 'credentials',
    showsMeta: scope === 'all',
    unfilledSecrets: (values: ConnectionFormValues) => {
      const options = lowercaseKeys(new URLSearchParams(values.options))
      return Object.fromEntries(
        missing.flatMap((secret) => {
          const { field, message } = SECRETS[secret]
          const value =
            field === 'options' ? options.get(secret) : getBy(values, field)
          return /\S/u.test(value ?? '') ? [] : [[field, message]]
        })
      )
    },
  }
}
