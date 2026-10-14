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
  className,
  items,
  renderValue,
  variant,
}: Pick<ComponentProps<typeof SelectTrigger>, 'className' | 'variant'> & {
  children?: ReactNode
  items: { label: string; value: Value }[]
  renderValue?: (value: Value) => ReactNode
}) => {
  const field = useFieldContext<Value>()

  return (
    <Select
      items={items}
      value={field.state.value}
      onValueChange={(next) => next !== null && field.handleChange(next)}
    >
      <SelectTrigger
        id={field.name}
        variant={variant}
        className={className}
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
