import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { QRCode } from 'react-qr-code'
import { toast } from 'sonner'

import { TotpCodeInput } from '~/components/totp-code-input'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

export const EnableTfaDialog = ({
  open,
  onOpenChange,
  totpURI,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  totpURI: string
}) => {
  const [code, setCode] = useState('')

  const { mutate: verifyTotp, isPending } = useMutation({
    mutationFn: (codeValue: string) =>
      authClient.twoFactor.verifyTotp({
        code: codeValue,
        fetchOptions: { throw: true },
        trustDevice: true,
      }),
    onError: (e) => {
      handleError(e)
      setCode('')
    },
    onSuccess: () => {
      toast.success('2FA enabled')
      onOpenChange(false)
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(nextOpen) => !nextOpen && setCode('')}
    >
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR Code with your authenticator app.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg bg-white p-4">
            <QRCode value={totpURI} size={176} />
          </div>
          <TotpCodeInput
            label="Verification code"
            value={code}
            onChange={setCode}
            onComplete={verifyTotp}
            disabled={isPending}
            autoFocus
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
