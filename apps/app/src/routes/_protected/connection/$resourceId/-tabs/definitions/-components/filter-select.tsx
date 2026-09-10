import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'

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
  <Select
    value={value}
    onValueChange={(next) => {
      if (next) {
        onValueChange(next)
      }
    }}
  >
    <SelectTrigger className="w-40">
      <SelectValue>
        {(current) => options.find((option) => option.value === current)?.label}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
