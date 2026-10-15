import {
  FolderOpenIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import type { SshAuth } from '@tamery/connection/ssh/params'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import { useState } from 'react'

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
  const [keyShown, setKeyShown] = useState(false)
  const [editingKey, setEditingKey] = useState(false)

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
          {(field) => {
            const keyButtons = (
              <>
                <LoadFileButton
                  disabled={locked(field.name)}
                  onLoad={field.handleChange}
                />
                <IconButton
                  variant="ghost-row"
                  size="icon-sm"
                  icon={keyShown ? ViewOffSlashIcon : ViewIcon}
                  label={keyShown ? 'Hide key' : 'Show key'}
                  onClick={() => setKeyShown((shown) => !shown)}
                />
              </>
            )
            return (
              <field.Field
                orientation="row"
                onFocus={(event) =>
                  setEditingKey(event.target.tagName === 'TEXTAREA')
                }
                onBlur={() => setEditingKey(false)}
              >
                <field.Label>Private key</field.Label>
                {field.state.value && !keyShown && !editingKey ? (
                  // A password input drops line breaks, so it only shows the key's first line and a paste replaces the whole key.
                  <InputGroup variant="inset">
                    <InputGroupInput
                      id={field.name}
                      type="password"
                      readOnly
                      data-mask
                      value={field.state.value.split('\n')[0]}
                      disabled={locked(field.name)}
                      onPaste={(event) => {
                        event.preventDefault()
                        field.handleChange(event.clipboardData.getData('text'))
                      }}
                    />
                    <InputGroupAddon align="inline-end">
                      {keyButtons}
                    </InputGroupAddon>
                  </InputGroup>
                ) : (
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
                    {keyButtons}
                  </field.Textarea>
                )}
              </field.Field>
            )
          }}
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
