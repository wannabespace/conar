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

export const OptionSelect = <T extends string>({
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

interface LabelledProps {
  description?: ReactNode
  label: string
}

export const Labelled = ({
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
  onChanged,
  ...select
}: LabelledProps & {
  disabled?: boolean
  labelOf?: (value: T) => string
  onChanged?: (value: T) => void
  options: readonly T[]
  placeholder: string
}) => {
  const field = useFieldContext<T>()

  return (
    <Labelled description={description} label={label}>
      <OptionSelect
        id={field.name}
        value={field.state.value}
        onValueChange={(next) => {
          field.handleChange(next)
          onChanged?.(next)
        }}
        {...select}
      />
    </Labelled>
  )
}

export const OptionsField = ({
  description,
  disabled,
  label,
  limit,
  options,
  placeholder,
}: LabelledProps & {
  disabled?: boolean
  limit?: number
  options: readonly string[] | undefined
  placeholder: string
}) => {
  const field = useFieldContext<string[]>()
  const selected = field.state.value

  return (
    <Labelled description={description} label={label}>
      <Combobox
        multiple
        autoHighlight
        disabled={disabled}
        items={options ?? noOptions}
        value={selected}
        onValueChange={(next: string[]) => {
          if (limit === undefined || next.length <= limit) {
            field.handleChange(next)
          }
        }}
      >
        <ComboboxChips data-mask>
          <ComboboxValue>
            {(items: string[]) =>
              items.map((item) => (
                <ComboboxChip key={item} aria-label={item}>
                  {item}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput
            id={field.name}
            placeholder={selected.length > 0 ? undefined : placeholder}
          />
        </ComboboxChips>
        <ComboboxContent data-mask>
          <ComboboxEmpty>
            {options ? 'Nothing found.' : <Spinner />}
          </ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Labelled>
  )
}

export const SchemaField = ({
  disabled,
  onChanged,
  schemas,
}: {
  disabled: boolean
  onChanged?: (schema: string) => void
  schemas: string[]
}) =>
  schemas.length > 1 && (
    <SelectField
      disabled={disabled}
      label="Schema"
      options={schemas}
      placeholder="Choose a schema"
      onChanged={onChanged}
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
