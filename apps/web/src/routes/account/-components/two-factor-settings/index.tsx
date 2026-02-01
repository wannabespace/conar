import { Button } from '@conar/ui/components/button'
import { useState } from 'react'
import { DisableDialog } from './disable-dialog'
import { EnableDialog } from './enable-dialog'

export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const [enableOpen, setEnableOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

  return (
    <>
      <Button
        variant={enabled ? 'outline' : 'default'}
        size="sm"
        onClick={() => enabled ? setDisableOpen(true) : setEnableOpen(true)}
      >
        {enabled ? 'Disable 2FA' : 'Enable 2FA'}
      </Button>

      {enableOpen && <EnableDialog open={enableOpen} onOpenChange={setEnableOpen} />}
      {disableOpen && <DisableDialog open={disableOpen} onOpenChange={setDisableOpen} />}
    </>
  )
}
