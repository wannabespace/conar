import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import { TotpCodeInput } from '~/components/totp-code-input'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

export function EnableTfaDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [totpUri, setTotpUri] = useState('')
  const [step, setStep] = useState<'password' | 'setup'>('password')

  const { mutate: enableTotp, isPending: isEnableTotpPending } = useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.enable({ password })

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: ({ totpURI }) => {
      setTotpUri(totpURI)
      setStep('setup')
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
      setStep('password')
    },
    onError: handleError,
    onSettled: () => {
      setTotpUri('')
    },
  })

  const form = useForm({
    defaultValues: {
      password: '',
      code: '',
    },
    onSubmit: ({ value }) => {
      if (step === 'password') {
        enableTotp(value.password)
      }
      else {
        verifyTotp(value.code)
      }
    },
  })

  const canSubmit = useStore(form.store, state => state.canSubmit)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'password' && (
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <DialogHeader>
              <DialogTitle>Enable 2FA</DialogTitle>
              <DialogDescription>
                Enter your password to continue.
              </DialogDescription>
            </DialogHeader>
            <form.Field name="password">
              {field => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="enable-password">Password</Label>
                  <Input
                    id="enable-password"
                    type="password"
                    name={field.name}
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    disabled={isEnableTotpPending}
                    autoComplete="current-password"
                    autoFocus
                    className="h-10"
                  />
                </div>
              )}
            </form.Field>
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="
                  w-full
                  sm:w-auto
                "
                disabled={isEnableTotpPending || !canSubmit}
              >
                <LoadingContent loading={isEnableTotpPending}>Continue</LoadingContent>
              </Button>
            </DialogFooter>
          </form>
        )}
        {step === 'setup' && (
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <DialogHeader className="gap-1.5">
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Scan this with your authenticator app, then enter the 6-digit code.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <QRCode value={totpUri} size={176} />
              </div>
              <form.Field name="code">
                {field => (
                  <div className="w-full">
                    <TotpCodeInput
                      label="Verification code"
                      value={field.state.value}
                      onChange={value => field.handleChange(value)}
                      disabled={isVerifyTotpPending}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="
                  w-full
                  sm:w-auto
                "
                disabled={isVerifyTotpPending || !canSubmit}
              >
                <LoadingContent loading={isVerifyTotpPending}>Verify</LoadingContent>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
