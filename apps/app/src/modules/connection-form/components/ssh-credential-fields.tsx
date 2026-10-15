import { FolderOpenIcon } from '@hugeicons/core-free-icons'
import type { SshAuth } from '@tamery/connection/ssh/params'
import { IconButton } from '@tamery/ui/components/custom/icon-button'

import type { ConnectionForm } from '../lib/connection-form'
import { PrivateKeyField } from './private-key-field'
import { TextRow } from './text-row'

export const SshCredentialFields = ({
  auth,
  form,
  locked,
}: {
  auth: SshAuth
  form: ConnectionForm
  locked: (field: string) => boolean
}) => {
  const row = { form, locked }

  if (auth === 'agent') {
    return null
  }

  if (auth === 'password') {
    return (
      <TextRow
        {...row}
        label="Password"
        aria-label="SSH password"
        name="ssh.password"
        secret
      />
    )
  }

  return (
    <>
      {auth === 'keyPath' ? (
        <TextRow
          {...row}
          label="Key file"
          name="ssh.keyPath"
          placeholder="~/.ssh/id_ed25519"
        >
          {window.electron && (
            <IconButton
              variant="ghost-faint"
              size="icon-sm"
              icon={FolderOpenIcon}
              label="Choose key file"
              disabled={locked('ssh.keyPath')}
              onClick={async () => {
                const keyPath = await window.electron?.ssh.pickKeyFile()
                if (keyPath) {
                  form.setFieldValue('ssh.keyPath', keyPath)
                }
              }}
            />
          )}
        </TextRow>
      ) : (
        <PrivateKeyField form={form} locked={locked('ssh.privateKey')} />
      )}
      <TextRow
        {...row}
        label="Passphrase"
        name="ssh.passphrase"
        secret
        placeholder="Only if the key has one"
      />
    </>
  )
}
