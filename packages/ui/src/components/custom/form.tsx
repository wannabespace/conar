import type { ReactNode } from 'react'
import type React from 'react'
import { Button } from '@conar/ui/components/button'
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@conar/ui/components/field'
import { Input } from '@conar/ui/components/input'
import { useFieldContext } from '@conar/ui/hooks/use-app-form'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'

function FieldBase({
  children,
  label,
  horizontal,
  className,
}: {
  children: (params: { invalid: boolean }) => ReactNode
  className?: string
  label?: string
  horizontal?: boolean
}) {
  const field = useFieldContext()
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field
      data-invalid={invalid}
      orientation={horizontal ? 'horizontal' : undefined}
      className={className}
    >
      <FieldContent>
        {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      </FieldContent>
      {children({ invalid })}
      {invalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

export function FieldInput({
  label,
  ...props
}: {
  label?: string
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur'>) {
  const field = useFieldContext<string>()

  return (
    <FieldBase label={label} className="gap-2">
      {({ invalid }) =>
        (
          <Input
            id={field.name}
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={e => field.handleChange(e.target.value)}
            aria-invalid={invalid}
            {...props}
          />
        )}
    </FieldBase>
  )
}

export function FieldPassword({
  label,
  showPassword,
  onToggle,
  placeholder = '••••••••',
  ...props
}: {
  label?: string
  showPassword: boolean
  onToggle: () => void
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur' | 'type'>) {
  const field = useFieldContext<string>()

  return (
    <FieldBase label={label} className="gap-2">
      {({ invalid }) => (
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            className="pe-10"
            placeholder={placeholder}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={e => field.handleChange(e.target.value)}
            aria-invalid={invalid}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={onToggle}
          >
            {showPassword
              ? <RiEyeOffLine className="size-4" aria-hidden="true" />
              : <RiEyeLine className="size-4" aria-hidden="true" />}
            <span className="sr-only">
              {showPassword ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>
      )}
    </FieldBase>
  )
}
