import { FolderOpenIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { SshAuth } from '@tamery/connection/ssh/params'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

import { LoadFileButton } from '~/components/load-file-button'

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
              >
                {window.electron && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost-row"
                          size="icon-sm"
                          aria-label="Choose key file"
                          onClick={async () => {
                            const keyPath =
                              await window.electron?.ssh.pickKeyFile()
                            if (keyPath) {
                              field.handleChange(keyPath)
                            }
                          }}
                        />
                      }
                    >
                      <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
                    </TooltipTrigger>
                    <TooltipContent>Choose key file</TooltipContent>
                  </Tooltip>
                )}
              </field.Input>
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
              >
                <LoadFileButton onLoad={field.handleChange} />
              </field.Textarea>
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
