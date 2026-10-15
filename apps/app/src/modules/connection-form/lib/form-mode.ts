import type { SecretParam } from '@tamery/connection/secrets'

import type { ConnectionString } from '~/core/connection/connection-strings'
import type { Connection } from '~/core/connection/sync'

export type FormMode =
  | { kind: 'create' }
  | {
      kind: 'edit'
      name: string
      /** The saved connection has a password this device never held, so an empty field still needs one. */
      passwordElsewhere: boolean
      missingSecrets: SecretParam[]
      /** `credentials` opens only what this device lacks, `details` the server details a metadata-only connection never syncs; neither touches the synced row. */
      scope: 'all' | 'credentials' | 'details'
    }

export type Secret = SecretParam | 'password'

/** The SSL secrets sit in Options, which is never empty, so they carry no message and never block a save. */
export const SECRETS: Record<
  Secret,
  { field: string; message: string | null }
> = {
  password: { field: 'password', message: 'Enter the password' },
  ssh_key: { field: 'ssh.privateKey', message: 'Paste the SSH private key' },
  ssh_passphrase: {
    field: 'ssh.passphrase',
    message: 'Enter the key passphrase',
  },
  ssh_password: { field: 'ssh.password', message: 'Enter the SSH password' },
  sslpassphrase: { field: 'options', message: null },
  sslpassword: { field: 'options', message: null },
}

export const editModeOf = (
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

/** Under `credentials`, the secrets this device lacks; `null` leaves every field open. */
const missingSecretsOf = (mode: FormMode): Secret[] | null => {
  if (mode.kind !== 'edit' || mode.scope !== 'credentials') {
    return null
  }
  return mode.passwordElsewhere
    ? ['password', ...mode.missingSecrets]
    : mode.missingSecrets
}

/** Field names the form may not change: under `credentials`, everything but what this device lacks. */
export const lockedFieldOf = (mode: FormMode) => {
  const missing = missingSecretsOf(mode)
  if (!missing) {
    return () => false
  }
  const open = new Set(missing.map((secret) => SECRETS[secret].field))
  return (field: string) => !open.has(field)
}

export const requiredSecretsOf = (mode: FormMode) =>
  missingSecretsOf(mode) ?? []
