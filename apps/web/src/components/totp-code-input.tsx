import { InputOTP, InputOTPGroup, InputOTPSlot } from '@conar/ui/components/input-otp'
import { Label } from '@conar/ui/components/label'

const TOTP_LENGTH = 6

interface TotpCodeInputProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  onComplete?: VoidFunction
  disabled?: boolean
  autoFocus?: boolean
}

export function TotpCodeInput({
  id = 'totp-code',
  label = 'Code',
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
}: TotpCodeInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <InputOTP
        id={id}
        maxLength={TOTP_LENGTH}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoFocus={autoFocus}
        onComplete={onComplete}
      >
        <InputOTPGroup>
          {Array.from({ length: TOTP_LENGTH }, (_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

export { TOTP_LENGTH }
