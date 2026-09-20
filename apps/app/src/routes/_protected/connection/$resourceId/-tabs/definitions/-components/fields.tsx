import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@tamery/ui/components/combobox'
import { FieldDescription } from '@tamery/ui/components/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Field,
  FieldInput,
  FieldLabel,
  FieldTextarea,
  useFieldContext,
} from '@tamery/ui/components/tanstack-form'
import { cn } from '@tamery/ui/lib/utils'
import type { AnyFormApi } from '@tanstack/react-form'
import type { ComponentProps, ReactNode } from 'react'

const identity = (value: string): string => value
const noOptions: readonly string[] = []

export const NameSelect = <T extends string>({
  className,
  disabled,
  id,
  labelOf = identity,
  mask = true,
  onValueChange,
  options,
  placeholder,
  value,
}: {
  className?: string
  disabled?: boolean
  id?: string
  labelOf?: (value: T) => string
  mask?: boolean
  onValueChange: (value: T) => void
  options: readonly T[]
  placeholder?: string
  value: T | ''
}) => (
  <Select
    value={value || null}
    disabled={disabled}
    onValueChange={(next) => {
      if (next) {
        onValueChange(next)
      }
    }}
  >
    <SelectTrigger
      id={id}
      data-mask={mask || undefined}
      className={cn('w-full', className)}
    >
      <SelectValue placeholder={placeholder}>
        {(current: T | null) => (current ? labelOf(current) : placeholder)}
      </SelectValue>
    </SelectTrigger>
    <SelectContent data-mask={mask || undefined}>
      {options.map((option) => (
        <SelectItem key={option} value={option}>
          {labelOf(option)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

const NamesSelect = ({
  disabled,
  id,
  limit,
  onValueChange,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean
  id: string
  limit?: number
  onValueChange: (value: string[]) => void
  options: readonly string[] | undefined
  placeholder: string
  value: string[]
}) => (
  <Combobox
    multiple
    autoHighlight
    disabled={disabled}
    items={options ?? noOptions}
    value={value}
    onValueChange={(next: string[]) => {
      if (limit === undefined || next.length <= limit) {
        onValueChange(next)
      }
    }}
  >
    <ComboboxChips data-mask>
      <ComboboxValue>
        {(selected: string[]) =>
          selected.map((item) => (
            <ComboboxChip key={item} aria-label={item}>
              {item}
            </ComboboxChip>
          ))
        }
      </ComboboxValue>
      <ComboboxChipsInput
        id={id}
        placeholder={value.length > 0 ? undefined : placeholder}
      />
    </ComboboxChips>
    <ComboboxContent data-mask>
      <ComboboxEmpty>{options ? 'Nothing found.' : <Spinner />}</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
)

interface LabelledProps {
  description?: ReactNode
  label: string
}

const Labelled = ({
  children,
  description,
  label,
}: LabelledProps & { children: ReactNode }) => (
  <Field>
    <FieldLabel>{label}</FieldLabel>
    {children}
    {description && <FieldDescription>{description}</FieldDescription>}
  </Field>
)

export const TextField = ({
  description,
  label,
  ...input
}: LabelledProps & ComponentProps<typeof FieldInput>) => (
  <Labelled description={description} label={label}>
    <FieldInput data-mask autoComplete="off" spellCheck={false} {...input} />
  </Labelled>
)

export const SqlField = ({
  description,
  label,
  ...textarea
}: LabelledProps & ComponentProps<typeof FieldTextarea>) => (
  <Labelled description={description} label={label}>
    <FieldTextarea
      data-mask
      className="font-mono"
      spellCheck={false}
      {...textarea}
    />
  </Labelled>
)

export const SelectField = <T extends string>({
  description,
  label,
  onValueChange,
  ...select
}: LabelledProps & {
  disabled?: boolean
  labelOf?: (value: T) => string
  onValueChange?: (value: T) => void
  options: readonly T[]
  placeholder: string
}) => {
  const field = useFieldContext<T>()

  return (
    <Labelled description={description} label={label}>
      <NameSelect
        id={field.name}
        value={field.state.value}
        onValueChange={onValueChange ?? field.handleChange}
        {...select}
      />
    </Labelled>
  )
}

export const NamesField = ({
  description,
  label,
  ...select
}: LabelledProps & {
  disabled?: boolean
  limit?: number
  options: readonly string[] | undefined
  placeholder: string
}) => {
  const field = useFieldContext<string[]>()

  return (
    <Labelled description={description} label={label}>
      <NamesSelect
        id={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}
        {...select}
      />
    </Labelled>
  )
}

export const SchemaField = ({
  disabled,
  onValueChange,
  schemas,
}: {
  disabled: boolean
  onValueChange?: (schema: string) => void
  schemas: string[]
}) =>
  schemas.length > 1 && (
    <SelectField
      disabled={disabled}
      label="Schema"
      options={schemas}
      placeholder="Choose a schema"
      onValueChange={onValueChange}
    />
  )

export const resetFields = (
  form: AnyFormApi,
  values: Record<string, unknown>
) => {
  for (const [name, value] of Object.entries(values)) {
    form.setFieldValue(name, value, { dontUpdateMeta: true })
    form.setFieldMeta(name, (meta) => ({ ...meta, isTouched: false }))
  }
}
