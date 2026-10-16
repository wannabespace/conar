import type { ComponentProps, ReactNode } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select'
import { useFieldContext } from './context'

/** `value` and `onValueChange` show and set something derived from the field, for a choice that writes more than it. */
export const FieldSelect = <Value extends string>({
  children,
  disabled,
  items,
  onValueChange,
  renderValue,
  value,
  variant,
}: Pick<ComponentProps<typeof SelectTrigger>, 'variant'> & {
  children?: ReactNode
  disabled?: boolean
  items: { label: string; value: Value }[]
  onValueChange?: (value: Value) => void
  renderValue?: (value: Value) => ReactNode
  value?: Value
}) => {
  const field = useFieldContext<Value>()

  return (
    <Select
      items={items}
      disabled={disabled}
      value={value ?? field.state.value}
      onValueChange={(next) =>
        next !== null && (onValueChange ?? field.handleChange)(next)
      }
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
          items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}
