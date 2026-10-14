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

const SECRET_FIELDS: Record<SecretParam, string> = {
  ssh_key: 'ssh.privateKey',
  ssh_passphrase: 'ssh.passphrase',
  ssh_password: 'ssh.password',
  sslpassphrase: 'options',
  sslpassword: 'options',
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

/** Under `credentials`, the fields holding what this device lacks; `null` leaves every field open. */
const openFieldsOf = (mode: FormMode) =>
  mode.kind === 'edit' && mode.scope === 'credentials'
    ? [
        ...(mode.passwordElsewhere ? ['password'] : []),
        ...mode.missingSecrets.map((param) => SECRET_FIELDS[param]),
      ]
    : null

/** Field names the form may not change: under `credentials`, everything but what this device lacks. */
export const lockedFieldOf = (mode: FormMode) => {
  const open = openFieldsOf(mode)
  if (!open) {
    return () => false
  }
  const openSet = new Set(open)
  return (field: string) => !openSet.has(field)
}

/** The secrets a credentials unlock must fill before it saves; an SSL key passphrase hides in Options, which is never empty. */
export const requiredSecretsOf = (mode: FormMode) =>
  (openFieldsOf(mode) ?? []).filter((field) => field !== 'options')
