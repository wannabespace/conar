import {
  Cancel01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useState } from 'react'

import { FiltersColumnSelector } from './filters/filters-column-selector'
import { FiltersOperatorSelector } from './filters/filters-operator-selector'
import { FiltersValueSelector } from './filters/filters-value-selector'

const ChipSegment = ({
  className,
  ...props
}: React.ComponentProps<'button'>) => (
  <button
    type="button"
    {...props}
    className={cn(
      `hover:bg-accent focus-visible:bg-accent flex cursor-default items-center gap-1 px-1.5 text-xs whitespace-nowrap outline-none`,
      className
    )}
  />
)

const ChipDivider = () => (
  <span aria-hidden className="bg-border w-px shrink-0" />
)

export const FilterChip = ({
  filter,
  onRemove,
  onEdit,
  onToggleDisabled,
}: {
  filter: ActiveFilter
  onRemove: () => void
  onEdit: (filter: ActiveFilter) => void
  onToggleDisabled: () => void
}) => {
  const [isColumnOpen, setIsColumnOpen] = useState(false)
  const [isOperatorOpen, setIsOperatorOpen] = useState(false)
  const [isValueOpen, setIsValueOpen] = useState(false)
  const [values, setValues] = useState(filter.values)

  const isValueEmpty =
    filter.values?.length === 0 || filter.values?.every((value) => value === '')

  return (
    <div className="ring-foreground/4 flex h-5 shrink-0 items-stretch overflow-hidden rounded-md bg-[color-mix(in_oklch,var(--input),var(--foreground)_4%)] shadow-2xs ring-[0.5px]">
      <Tooltip>
        <TooltipTrigger
          render={
            <ChipSegment
              aria-label={filter.disabled ? 'Enable filter' : 'Disable filter'}
              aria-pressed={!filter.disabled}
              className="text-muted-foreground px-1"
              onClick={onToggleDisabled}
            />
          }
        >
          <HugeiconsIcon
            icon={filter.disabled ? ViewOffSlashIcon : ViewIcon}
            strokeWidth={2}
            className="size-3.5"
          />
        </TooltipTrigger>
        <TooltipContent side="top">
          {filter.disabled ? 'Enable filter' : 'Disable filter'}
        </TooltipContent>
      </Tooltip>
      <ChipDivider />
      <div
        className={cn('flex items-stretch', filter.disabled && 'opacity-45')}
      >
        <Popover open={isColumnOpen} onOpenChange={setIsColumnOpen}>
          <PopoverTrigger
            data-mask
            render={<ChipSegment className="font-medium" />}
          >
            {filter.column}
          </PopoverTrigger>
          <PopoverContent className="p-0 **:data-[slot=popover-viewport]:p-0">
            <FiltersColumnSelector
              onSelect={(column) => {
                onEdit({ ...filter, column, values })
                setIsColumnOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        <ChipDivider />
        <Popover open={isOperatorOpen} onOpenChange={setIsOperatorOpen}>
          <PopoverTrigger
            render={<ChipSegment className="text-muted-foreground" />}
          >
            {filter.ref.label}
          </PopoverTrigger>
          <PopoverContent className="p-0 **:data-[slot=popover-viewport]:p-0">
            <FiltersOperatorSelector
              onSelect={(operator) => {
                onEdit({ ...filter, ref: operator, values })
                setIsOperatorOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        {filter.ref.hasValue !== false && (
          <>
            <ChipDivider />
            <Popover open={isValueOpen} onOpenChange={setIsValueOpen}>
              <PopoverTrigger
                data-mask
                render={<ChipSegment className="max-w-40 font-mono" />}
              >
                <span className="truncate">
                  {isValueEmpty ? (
                    <span className="opacity-40">empty</span>
                  ) : (
                    filter.values?.join(', ')
                  )}
                </span>
              </PopoverTrigger>
              <PopoverContent className="max-h-[calc(100vh-10rem)] p-0 **:data-[slot=popover-viewport]:p-0">
                <FiltersValueSelector
                  column={filter.column}
                  operator={filter.ref.operator}
                  isArray={filter.ref.isArray ?? false}
                  values={values}
                  onChange={setValues}
                  onApply={() => {
                    onEdit({ ...filter, values })
                    setIsValueOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
      <ChipDivider />
      <Tooltip>
        <TooltipTrigger
          render={
            <ChipSegment
              aria-label="Remove filter"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive px-1"
              onClick={onRemove}
            />
          }
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
        </TooltipTrigger>
        <TooltipContent side="top">Remove filter</TooltipContent>
      </Tooltip>
    </div>
  )
}
