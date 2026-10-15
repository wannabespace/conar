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

/** Under `credentials`, the fields holding what this device lacks: the only ones the form may change. */
export const missingFieldsOf = (mode: FormMode) => {
  if (mode.kind !== 'edit' || mode.scope !== 'credentials') {
    return []
  }
  const fields = mode.missingSecrets.map((secret) => SECRET_FIELDS[secret])
  return mode.passwordElsewhere ? ['password', ...fields] : fields
}
