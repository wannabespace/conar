import type { SshAuth } from '@tamery/connection/ssh/params'

import type { ConnectionForm } from '../lib/connection-form'

export const SshCredentialFields = ({
  auth,
  form,
}: {
  auth: SshAuth
  form: ConnectionForm
}) => {
  if (auth === 'agent') {
    return null
  }

  if (auth === 'password') {
    return (
      <form.AppField name="ssh.password">
        {(field) => (
          <field.Field orientation="row">
            <field.Label>Password</field.Label>
            <field.PasswordInput variant="inset" data-mask autoComplete="off" />
          </field.Field>
        )}
      </form.AppField>
    )
  }

  return (
    <>
      {auth === 'keyPath' ? (
        <form.AppField name="ssh.keyPath">
          {(field) => (
            <field.Field orientation="row">
              <field.Label>Key file</field.Label>
              <field.Input
                variant="inset"
                data-mask
                spellCheck={false}
                autoComplete="off"
                placeholder="~/.ssh/id_ed25519"
              />
            </field.Field>
          )}
        </form.AppField>
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
                fileLabel="Load from file"
              />
            </field.Field>
          )}
        </form.AppField>
      )}
      <form.AppField name="ssh.passphrase">
        {(field) => (
          <field.Field orientation="row">
            <field.Label>Passphrase</field.Label>
            <field.PasswordInput
              variant="inset"
              data-mask
              autoComplete="off"
              placeholder="Only if the key has one"
            />
          </field.Field>
        )}
      </form.AppField>
    </>
  )
}
