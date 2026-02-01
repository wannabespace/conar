import { Button } from '@conar/ui/components/button'
import { Checkbox } from '@conar/ui/components/checkbox'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { FieldGroup } from '@conar/ui/components/field'
import { Label } from '@conar/ui/components/label'
import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { type } from 'arktype'
import { toast } from 'sonner'
import { TOTP_LENGTH, TotpCodeInput } from '~/components/totp-code-input'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

const twoFactorSchema = type({
  code: 'string',
  trustDevice: 'boolean',
})

interface TwoFactorVerifyProps {
  onSuccess: () => void | Promise<void>
  allowTrustDevice?: boolean
  trustDeviceDefault?: boolean
}

export function TwoFactorVerify({
  onSuccess,
  allowTrustDevice = true,
  trustDeviceDefault = false,
}: TwoFactorVerifyProps) {
  const verifyTotp = useMutation({
    mutationKey: ['two-factor', 'verify-totp'],
    mutationFn: async ({ code, trustDevice }: typeof twoFactorSchema.infer) => {
      const { error } = await authClient.twoFactor.verifyTotp({
        code,
        ...(allowTrustDevice && trustDevice !== undefined ? { trustDevice } : {}),
      })
      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      toast.success('Verified')
      await onSuccess()
    },
    onError: handleError,
  })

  const form = useForm({
    defaultValues: {
      code: '',
      trustDevice: trustDeviceDefault,
    },
    validators: {
      onSubmit: twoFactorSchema,
    },
    onSubmit: ({ value: { code, trustDevice } }) => {
      verifyTotp.mutate({ code, trustDevice: allowTrustDevice ? trustDevice : false }, {
        onError: () => form.reset(),
      })
    },
  })

  const { isSubmitting, values: { code } } = useStore(form.store, ({ isSubmitting, values }) => ({
    isSubmitting,
    values,
  }))
  const canSubmit = (code?.length ?? 0) === TOTP_LENGTH

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup className="gap-4">
        <form.Field name="code">
          {field => (
            <TotpCodeInput
              value={field.state.value}
              onChange={value => field.handleChange(value)}
              disabled={verifyTotp.isPending}
              autoFocus
            />
          )}
        </form.Field>

        {allowTrustDevice && (
          <form.Field name="trustDevice">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="trustDevice"
                  checked={field.state.value}
                  onCheckedChange={checked => field.handleChange(Boolean(checked))}
                  disabled={verifyTotp.isPending}
                />
                <Label
                  htmlFor="trustDevice"
                  className="cursor-pointer text-sm font-normal text-muted-foreground"
                >
                  Trust this device
                </Label>
              </div>
            )}
          </form.Field>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={verifyTotp.isPending || !canSubmit || isSubmitting}
        >
          <LoadingContent loading={verifyTotp.isPending}>Verify</LoadingContent>
        </Button>
      </FieldGroup>
    </form>
  )
}
