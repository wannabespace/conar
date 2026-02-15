import type { ComponentType } from 'react'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import QRCodeLib from 'react-qr-code'
import { toast } from 'sonner'
import { TotpCodeInput } from '~/components/totp-code-input'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

// react-qr-code is a class component that doesn't align with React 19 types
const QRCode = QRCodeLib as unknown as ComponentType<{ value: string, size?: number }>

export function EnableTfaDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [setupOpen, setSetupOpen] = useState(false)

  const { mutate: enableTotp, isPending: isEnableTotpPending, data: totpURI } = useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.enable({ password })

      if (error) {
        throw error
      }

      return data.totpURI
    },
    onSuccess: () => {
      setSetupOpen(true)
    },
    onError: handleError,
  })

  const { mutate: verifyTotp, isPending: isVerifyTotpPending } = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await authClient.twoFactor.verifyTotp({ code })

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      toast.success('2FA enabled')
      onOpenChange(false)
      setSetupOpen(false)
    },
    onError: (e) => {
      handleError(e)
      setCode('')
    },
  })

  function handleClose() {
    onOpenChange(false)
    setSetupOpen(false)
    setPassword('')
    setCode('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        onSubmit={(e) => {
          e.preventDefault()
          enableTotp(password)
        }}
        render={<form />}
      >
        <DialogHeader>
          <DialogTitle>Enable 2FA</DialogTitle>
          <DialogDescription>
            Enter your password to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-2">
          <Label htmlFor="enable-password">
            Password
          </Label>
          <Input
            id="enable-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isEnableTotpPending}
            autoComplete="current-password"
            autoFocus
          />
        </DialogPanel>
        <DialogFooter>
          <Dialog open={setupOpen} onOpenChange={open => !open && handleClose()}>
            <DialogTrigger
              className="
                w-full
                sm:w-auto
              "
              disabled={isEnableTotpPending || password.length === 0}
              render={<Button type="submit" variant="outline" />}
            >
              <LoadingContent loading={isEnableTotpPending}>Continue</LoadingContent>
            </DialogTrigger>
            <DialogContent
              className="
                flex flex-col gap-6
                sm:max-w-xs
              "
              showCloseButton={false}
              onSubmit={(e) => {
                e.preventDefault()
                verifyTotp(code)
              }}
              render={<form />}
            >
              <DialogHeader>
                <DialogTitle>Scan QR Code</DialogTitle>
                <DialogDescription>
                  Scan this QR Code with your authenticator app.
                </DialogDescription>
              </DialogHeader>
              <DialogPanel className="flex flex-col items-center gap-4">
                <div className="rounded-lg bg-white p-4">
                  {totpURI && <QRCode value={totpURI} size={176} />}
                </div>
                <TotpCodeInput
                  label="Verification code"
                  value={code}
                  onChange={(value: string) => setCode(value)}
                  onComplete={(value: string) => verifyTotp(value)}
                  disabled={isVerifyTotpPending}
                />
              </DialogPanel>
            </DialogContent>
          </Dialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
