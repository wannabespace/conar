import type { ComponentProps, ReactNode } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select'
import { useFieldContext } from './context'

export const FieldSelect = <Value extends string>({
  children,
  disabled,
  items,
  renderValue,
  variant,
}: Pick<ComponentProps<typeof SelectTrigger>, 'variant'> & {
  children?: ReactNode
  disabled?: boolean
  items: { label: string; value: Value }[]
  renderValue?: (value: Value) => ReactNode
}) => {
  const field = useFieldContext<Value>()

  return (
    <Select
      items={items}
      disabled={disabled}
      value={field.state.value}
      onValueChange={(next) => next !== null && field.handleChange(next)}
    >
      <SelectTrigger
        id={field.name}
        // The trigger is a div, which `<label for>` cannot name.
        aria-labelledby={`${field.name}-label`}
        variant={variant}
        onBlur={field.handleBlur}
      >
        <SelectValue>{renderValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {children ??
          items.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}
