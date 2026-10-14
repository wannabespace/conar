import { FolderOpenIcon } from '@hugeicons/core-free-icons'
import type { SshAuth } from '@tamery/connection/ssh/params'
import { IconButton } from '@tamery/ui/components/custom/icon-button'

import type { ConnectionForm } from '../lib/connection-form'
import { LoadFileButton } from './load-file-button'
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
    return <TextRow {...row} label="Password" name="ssh.password" secret />
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
              variant="ghost-row"
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
        <form.AppField name="ssh.privateKey">
          {(field) => (
            <field.Field orientation="row">
              <field.Label>Private key</field.Label>
              <field.Textarea
                variant="inset"
                rows={1}
                data-mask
                spellCheck={false}
                autoComplete="off"
                placeholder="Paste the key, or load it from a file"
                className="max-h-24"
                disabled={locked(field.name)}
              >
                <LoadFileButton
                  disabled={locked(field.name)}
                  onLoad={field.handleChange}
                />
              </field.Textarea>
            </field.Field>
          )}
        </form.AppField>
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
