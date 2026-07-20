import { RiAddLine, RiCloseLine } from '@remixicon/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { Popover, PopoverContent, PopoverTrigger } from '@tamery/ui/components/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { useTablePageStore } from '../../store'
import { FiltersColumnSelector } from '../filters/filters-column-selector'
import { FilterForm } from '../filters/filters-form'
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

function FilterChip({
  filter,
  onRemove,
  onEdit,
  onPopoverOpenChange,
}: {
  filter: ActiveFilter
  onRemove: () => void
  onEdit: (filter: ActiveFilter) => void
  onPopoverOpenChange: (open: boolean) => void
}) {
  const [isColumnOpen, setIsColumnOpen] = useState(false)
  const [isOperatorOpen, setIsOperatorOpen] = useState(false)
  const [isValueOpen, setIsValueOpen] = useState(false)
  const [values, setValues] = useState(filter.values)

  const trackOpen = (setOpen: (open: boolean) => void) => (open: boolean) => {
    setOpen(open)
    onPopoverOpenChange(open)
  }

  const setColumnOpen = trackOpen(setIsColumnOpen)
  const setOperatorOpen = trackOpen(setIsOperatorOpen)
  const setValueOpen = trackOpen(setIsValueOpen)

  const isValueEmpty = filter.values?.length === 0 || filter.values?.every(value => value === '')

  return (
    <div
      className="
        flex h-6 shrink-0 items-stretch overflow-hidden rounded-md border
        bg-input shadow-xs
      "
    >
      <Popover open={isColumnOpen} onOpenChange={setColumnOpen}>
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
              onEdit({ column, ref: filter.ref, values })
              setColumnOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <ChipDivider />
      <Popover open={isOperatorOpen} onOpenChange={setOperatorOpen}>
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
              onEdit({ column: filter.column, ref: operator, values })
              setOperatorOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {filter.ref.hasValue !== false && (
        <>
          <ChipDivider />
          <Popover open={isValueOpen} onOpenChange={setValueOpen}>
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
                  onEdit({ column: filter.column, ref: filter.ref, values })
                  setValueOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </>
      )}
      <ChipDivider />
      <ChipSegment
        aria-label="Remove filter"
        className="
          px-1 text-muted-foreground
          hover:bg-destructive/10 hover:text-destructive
        "
        onClick={onRemove}
      >
        <RiCloseLine className="size-3.5" />
      </ChipSegment>
    </div>
  )
}

// Tucked behind the glass command bar by default (ghosting through it); slides
// up when the dock is hovered or while any of its pickers is open
const TUCKED_Y = 'calc(100% + 0.5rem)'

export function FiltersRow({ revealed }: { revealed: boolean }) {
  const store = useTablePageStore()
  const filters = useSubscription(store, { selector: state => state.filters })
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [heldPopovers, setHeldPopovers] = useState(0)

  const trackPopover = (open: boolean) => {
    setHeldPopovers(count => Math.max(0, count + (open ? 1 : -1)))
  }

  const setAddOpen = (open: boolean) => {
    setIsAddOpen(open)
    trackPopover(open)
  }

  const isRevealed = revealed || heldPopovers > 0

  return (
    <AnimatePresence initial={false}>
      {filters.length > 0 && (
        <motion.div
          key="filters"
          initial={{ opacity: 0, y: TUCKED_Y, scale: 0.9, rotateX: 18 }}
          animate={{
            opacity: 1,
            y: isRevealed ? 0 : TUCKED_Y,
            scale: isRevealed ? 1 : 0.9,
            rotateX: isRevealed ? 0 : 18,
          }}
          exit={{ opacity: 0, y: TUCKED_Y, scale: 0.9, rotateX: 18 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          style={{ transformPerspective: 800 }}
          className="
            pointer-events-auto -mb-2 flex max-w-full origin-bottom flex-wrap
            items-center justify-center gap-1 pb-2
          "
        >
          {filters.map((filter, index) => (
            <FilterChip
              // oxlint-disable-next-line react/no-array-index-key
              key={`${filter.column}-${filter.ref.operator}-${filter.values.join(',')}-${index}`}
              filter={filter}
              onRemove={() =>
                store.set(
                  state =>
                    ({
                      ...state,
                      filters: state.filters.filter((_, i) => i !== index),
                    }) satisfies typeof state,
                )
              }
              onEdit={({ column, ref, values }) =>
                store.set(
                  state =>
                    ({
                      ...state,
                      filters: state.filters.map((f, i) =>
                        i === index ? { column, ref, values } : f,
                      ),
                    }) satisfies typeof state,
                )
              }
              onPopoverOpenChange={trackPopover}
            />
          ))}
          <Popover open={isAddOpen} onOpenChange={setAddOpen}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Add filter"
                        className="
                          flex size-6 shrink-0 cursor-default items-center
                          justify-center rounded-md border bg-input
                          text-muted-foreground shadow-xs outline-none
                          hover:bg-accent hover:text-foreground
                          focus-visible:bg-accent
                        "
                      />
                    }
                  />
                }
              >
                <RiAddLine className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top">Add filter</TooltipContent>
            </Tooltip>
            <PopoverContent
              className="
                p-0
                **:data-[slot=popover-viewport]:p-0
              "
            >
              <FilterForm
                onAdd={filter => {
                  setAddOpen(false)
                  store.set(
                    state =>
                      ({
                        ...state,
                        filters: [...state.filters, filter],
                      }) satisfies typeof state,
                  )
                }}
              />
            </PopoverContent>
          </Popover>
          <button
            type="button"
            className="
              h-6 shrink-0 cursor-default rounded-md border bg-input px-1.5
              text-xs text-muted-foreground shadow-xs outline-none
              hover:bg-destructive/10 hover:text-destructive
              focus-visible:bg-accent
            "
            onClick={() => store.set(state => ({ ...state, filters: [] }) satisfies typeof state)}
          >
            Clear
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
