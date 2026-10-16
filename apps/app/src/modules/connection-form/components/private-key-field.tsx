import { ViewIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import { useState } from 'react'

import type { ConnectionForm } from '../lib/connection-form'
import { LoadFileButton } from './load-file-button'

export const PrivateKeyField = ({
  form,
  locked,
}: {
  form: ConnectionForm
  locked: boolean
}) => {
  const [keyShown, setKeyShown] = useState(false)
  const [editingKey, setEditingKey] = useState(false)

  return (
    <form.AppField name="ssh.privateKey">
      {(field) => {
        const keyButtons = (
          <>
            <LoadFileButton disabled={locked} onLoad={field.handleChange} />
            <IconButton
              variant="ghost-faint"
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
              event.target.tagName === 'TEXTAREA' && setEditingKey(true)
            }
            onBlur={(event) =>
              !event.currentTarget.contains(event.relatedTarget) &&
              setEditingKey(false)
            }
          >
            <field.Label>Private key</field.Label>
            {field.state.value && !keyShown && !editingKey ? (
              <InputGroup variant="inset">
                <InputGroupInput
                  id={field.name}
                  type="password"
                  readOnly
                  data-mask
                  value={field.state.value.split('\n')[0]}
                  disabled={locked}
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
                disabled={locked}
              >
                {keyButtons}
              </field.Textarea>
            )}
          </field.Field>
        )
      }}
    </form.AppField>
  )
}
