import { Button } from '@tamery/ui/components/button'
import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { useState } from 'react'

import { DeleteAccountDialog } from './delete-account-dialog'

export const DeleteAccountSettings = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DeleteAccountDialog open={open} onOpenChange={setOpen} />
      <SettingsGroup title="Account">
        <SettingsRow
          title="Delete account"
          description="Removes your account and all of its data for good."
        >
          <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
            Delete
          </Button>
        </SettingsRow>
      </SettingsGroup>
    </>
  )
}
