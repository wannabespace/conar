import type { ReactNode } from 'react'
import type React from 'react'
import { Button } from '@conar/ui/components/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@conar/ui/components/field'
import { Input } from '@conar/ui/components/input'
import { useFieldContext } from '@conar/ui/hooks/use-app-form'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'

interface FormControlProps {
  label?: string
  description?: string
}

type FormInputProps = FormControlProps & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur'>

type FormBaseProps = FormControlProps & {
  children: ReactNode
  horizontal?: boolean
  controlFirst?: boolean
  className?: string
}

function FormBase({
  children,
  label,
  description,
  controlFirst,
  horizontal,
  className,
}: FormBaseProps) {
  const field = useFieldContext()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const labelElement = label
    ? (
        <>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
        </>
      )
    : description
      ? (
          <FieldDescription>{description}</FieldDescription>
        )
      : null
  const errorElem = isInvalid && <FieldError errors={field.state.meta.errors} />

  return (
    <Field
      data-invalid={isInvalid}
      orientation={horizontal ? 'horizontal' : undefined}
      className={className}
    >
      {controlFirst
        ? (
            <>
              {children}
              <FieldContent>
                {labelElement}
                {errorElem}
              </FieldContent>
            </>
          )
        : (
            <>
              <FieldContent>{labelElement}</FieldContent>
              {children}
              {errorElem}
            </>
          )}
    </Field>
  )
}

function FormInput({ label, description, ...inputProps }: FormInputProps) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <FormBase label={label} description={description} className="gap-2">
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={e => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        {...inputProps}
      />
    </FormBase>
  )
}

type PasswordInputProps = {
  showPassword: boolean
  onToggle: () => void
} & Omit<React.ComponentProps<typeof Input>, 'type'>

function PasswordInput({ showPassword, onToggle, ...props }: PasswordInputProps) {
  return (
    <div className="relative">
      <Input type={showPassword ? 'text' : 'password'} className="pe-10" {...props} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={onToggle}
        tabIndex={-1}
      >
        {showPassword
          ? (
              <RiEyeOffLine className="size-4" aria-hidden="true" />
            )
          : (
              <RiEyeLine className="size-4" aria-hidden="true" />
            )}
        <span className="sr-only">
          {showPassword ? 'Hide password' : 'Show password'}
        </span>
      </Button>
    </div>
  )
}

function FormPassword({
  label,
  description,
  showPassword,
  onToggle,
  placeholder = '••••••••',
  ...inputProps
}: FormControlProps & {
  showPassword: boolean
  onToggle: () => void
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur' | 'type'>) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <FormBase label={label} description={description} className="gap-2">
      <PasswordInput
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={e => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        showPassword={showPassword}
        onToggle={onToggle}
        placeholder={placeholder}
        {...inputProps}
      />
    </FormBase>
  )
}

export {
  FormBase,
  FormInput,
  FormPassword,
}
