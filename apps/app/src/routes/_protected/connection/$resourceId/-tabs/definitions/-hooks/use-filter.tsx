import { useState } from 'react'

import { OptionSelect } from '../-components/fields'

export interface FilterOption<T extends string> {
  label: string
  value: T
}

export const useFilter = <T extends string>(
  all: string,
  options: readonly FilterOption<T>[]
) => {
  const [value, setValue] = useState<T | 'all'>('all')
  const choices: FilterOption<T | 'all'>[] = [
    { label: all, value: 'all' },
    ...options,
  ]

  return {
    control: (
      <OptionSelect
        className="w-40"
        mask={false}
        options={choices.map((choice) => choice.value)}
        labelOf={(current) =>
          choices.find((choice) => choice.value === current)?.label ?? current
        }
        value={value}
        onValueChange={setValue}
      />
    ),
    matches: (candidate: T) => value === 'all' || value === candidate,
    value,
  }
}
