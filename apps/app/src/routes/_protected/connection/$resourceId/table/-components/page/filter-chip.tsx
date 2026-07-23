import { RiCloseLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { Popover, PopoverContent, PopoverTrigger } from '@tamery/ui/components/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useState } from 'react'

import { FiltersColumnSelector } from '../filters/filters-column-selector'
import { FiltersSelector } from '../filters/filters-selector'
import { FilterValueSelector } from '../filters/filters-value-selector'

function ChipSegment({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        `
          flex cursor-default items-center gap-1 px-1.5 text-xs whitespace-nowrap
          outline-none
          hover:bg-accent
          focus-visible:bg-accent
        `,
        className,
      )}
    />
  )
}

function ChipDivider() {
  return <span aria-hidden className="w-px shrink-0 bg-border" />
}

export function FilterChip({
  filter,
  onRemove,
  onEdit,
  onToggleDisabled,
}: {
  filter: ActiveFilter
  onRemove: () => void
  onEdit: (filter: ActiveFilter) => void
  onToggleDisabled: () => void
}) {
  const [isColumnOpen, setIsColumnOpen] = useState(false)
  const [isOperatorOpen, setIsOperatorOpen] = useState(false)
  const [isValueOpen, setIsValueOpen] = useState(false)
  const [values, setValues] = useState(filter.values)

  const isValueEmpty = filter.values?.length === 0 || filter.values?.every(value => value === '')

  return (
    <div
      className="
        flex h-5 shrink-0 items-stretch overflow-hidden rounded-md
        bg-[color-mix(in_oklch,var(--input),var(--foreground)_4%)] shadow-2xs
        ring-[0.5px] ring-foreground/4
      "
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <ChipSegment
              aria-label={filter.disabled ? 'Enable filter' : 'Disable filter'}
              aria-pressed={!filter.disabled}
              className="px-1 text-muted-foreground"
              onClick={onToggleDisabled}
            />
          }
        >
          {filter.disabled ? (
            <RiEyeOffLine className="size-3.5" />
          ) : (
            <RiEyeLine className="size-3.5" />
          )}
        </TooltipTrigger>
        <TooltipContent side="top">
          {filter.disabled ? 'Enable filter' : 'Disable filter'}
        </TooltipContent>
      </Tooltip>
      <ChipDivider />
      <div className={cn('flex items-stretch', filter.disabled && 'opacity-45')}>
        <Popover open={isColumnOpen} onOpenChange={setIsColumnOpen}>
          <PopoverTrigger data-mask render={<ChipSegment className="font-medium" />}>
            {filter.column}
          </PopoverTrigger>
          <PopoverContent
            className="
              p-0
              **:data-[slot=popover-viewport]:p-0
            "
          >
            <FiltersColumnSelector
              onSelect={column => {
                onEdit({ ...filter, column, values })
                setIsColumnOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        <ChipDivider />
        <Popover open={isOperatorOpen} onOpenChange={setIsOperatorOpen}>
          <PopoverTrigger render={<ChipSegment className="text-muted-foreground" />}>
            {filter.ref.operator}
          </PopoverTrigger>
          <PopoverContent
            className="
              p-0
              **:data-[slot=popover-viewport]:p-0
            "
          >
            <FiltersSelector
              onSelect={operator => {
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
              <PopoverTrigger data-mask render={<ChipSegment className="max-w-40 font-mono" />}>
                <span className="truncate">
                  {isValueEmpty ? (
                    <span className="opacity-40">empty</span>
                  ) : (
                    filter.values?.join(', ')
                  )}
                </span>
              </PopoverTrigger>
              <PopoverContent
                className="
                  max-h-[calc(100vh-10rem)] p-0
                  **:data-[slot=popover-viewport]:p-0
                "
              >
                <FilterValueSelector
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
              className="
                px-1 text-muted-foreground
                hover:bg-destructive/10 hover:text-destructive
              "
              onClick={onRemove}
            />
          }
        >
          <RiCloseLine className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Remove filter</TooltipContent>
      </Tooltip>
    </div>
  )
}
