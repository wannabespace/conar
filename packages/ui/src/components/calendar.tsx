import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { buttonVariants } from '@tamery/ui/components/button.utils'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'
import type { ChevronProps, DayButton, Root } from 'react-day-picker'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'

const CalendarChevron = ({
  className,
  orientation,
  ...props
}: ChevronProps) => (
  <HugeiconsIcon
    icon={orientation === 'left' ? ArrowLeft01Icon : ArrowRight01Icon}
    strokeWidth={2}
    className={cn('size-4', className)}
    {...props}
  />
)

const CalendarRoot = ({
  className,
  rootRef,
  ...props
}: React.ComponentProps<typeof Root>) => (
  <div
    data-slot="calendar"
    ref={rootRef}
    className={cn(className)}
    {...props}
  />
)

const CalendarDayButton = ({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) => {
  const defaultClassNames = getDefaultClassNames()
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus()
    }
  }, [modifiers.focused])

  return (
    <Button
      data-day={day.date.toLocaleDateString()}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-range-start={modifiers.range_start}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      ref={ref}
      size="icon"
      variant="ghost"
      className={cn(
        `data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:bg-foreground/5 data-[range-middle=true]:text-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground relative isolate z-10 flex aspect-square w-full min-w-(--cell-size) flex-col gap-1 rounded-(--cell-radius) border-0 font-normal tabular-nums data-[range-end=true]:rounded-l-none data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-r-none`,
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

const calendarComponents = {
  Chevron: CalendarChevron,
  DayButton: CalendarDayButton,
  Root: CalendarRoot,
}

const Calendar = ({
  className,
  classNames,
  components,
  formatters,
  locale,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) => {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      locale={locale}
      showOutsideDays={showOutsideDays}
      className={cn(
        'group/calendar [--cell-radius:var(--radius-lg)] [--cell-size:--spacing(8)]',
        className
      )}
      components={{ ...calendarComponents, ...components }}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        button_next: cn(
          buttonVariants({ size: 'icon-sm', variant: 'ghost' }),
          'select-none aria-disabled:opacity-50',
          defaultClassNames.button_next
        ),
        button_previous: cn(
          buttonVariants({ size: 'icon-sm', variant: 'ghost' }),
          'select-none aria-disabled:opacity-50',
          defaultClassNames.button_previous
        ),
        caption_label: cn(
          'text-sm font-medium select-none',
          defaultClassNames.caption_label
        ),
        day: cn(
          'group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none',
          defaultClassNames.day
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        month_caption: cn(
          'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)',
          defaultClassNames.month_caption
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        months: cn(
          'relative flex flex-col gap-4 md:flex-row',
          defaultClassNames.months
        ),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav
        ),
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside
        ),
        range_end: cn(
          'bg-foreground/5 rounded-l-none rounded-r-(--cell-radius)',
          defaultClassNames.range_end
        ),
        range_middle: cn(
          'bg-foreground/5 rounded-none',
          defaultClassNames.range_middle
        ),
        range_start: cn(
          'bg-foreground/5 rounded-l-(--cell-radius) rounded-r-none',
          defaultClassNames.range_start
        ),
        root: cn('w-fit', defaultClassNames.root),
        today: cn(
          'text-primary font-medium data-[selected=true]:text-inherit',
          defaultClassNames.today
        ),
        week: cn('mt-1 flex w-full', defaultClassNames.week),
        weekday: cn(
          'text-muted-foreground flex-1 text-xs font-normal select-none',
          defaultClassNames.weekday
        ),
        weekdays: cn('flex', defaultClassNames.weekdays),
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
export type { DateRange } from 'react-day-picker'
