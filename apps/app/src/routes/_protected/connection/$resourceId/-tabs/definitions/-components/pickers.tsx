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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { cn } from '@tamery/ui/lib/utils'

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

export interface FilterOption<T extends string> {
  label: string
  value: T
}

export const FilterSelect = <T extends string>({
  onValueChange,
  options,
  value,
}: {
  onValueChange: (value: T) => void
  options: readonly FilterOption<T>[]
  value: T
}) => (
  <NameSelect
    className="w-40"
    mask={false}
    options={options.map((option) => option.value)}
    labelOf={(current) =>
      options.find((option) => option.value === current)?.label ?? current
    }
    value={value}
    onValueChange={onValueChange}
  />
)

export const NamesSelect = ({
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
      <ComboboxEmpty>{options ? 'Nothing found.' : 'Loading…'}</ComboboxEmpty>
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
