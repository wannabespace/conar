import type { ControllerRenderProps } from 'react-hook-form'
import { Button } from '@conar/ui/components/button'
import { Input } from '@conar/ui/components/input'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'

interface PasswordFormFields {
  password: string
  confirmPassword: string
}

type PasswordFieldProps = ControllerRenderProps<PasswordFormFields, keyof PasswordFormFields>

interface PasswordInputProps extends PasswordFieldProps {
  showPassword: boolean
  onToggle: () => void
  placeholder?: string
  autoComplete?: string
}

export default function PasswordInput({
  showPassword,
  onToggle,
  placeholder = '••••••••',
  autoComplete = 'new-password',
  ...props
}: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        type={showPassword ? 'text' : 'password'}
        autoCapitalize="none"
        autoComplete={autoComplete}
        spellCheck="false"
        required
        className="pe-10"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 size-7 -translate-y-1/2"
        onClick={onToggle}
        tabIndex={-1}
      >
        {showPassword ? <RiEyeOffLine className="size-4" /> : <RiEyeLine className="size-4" />}
        <span className="sr-only">
          {showPassword ? 'Hide password' : 'Show password'}
        </span>
      </Button>
    </div>
  )
}
