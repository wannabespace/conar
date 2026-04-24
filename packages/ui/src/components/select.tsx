import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@conar/ui/lib/utils'
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from 'lucide-react'
import { selectTriggerIconClassName, selectTriggerVariants } from './select.variants'

// eslint-disable-next-line react-refresh/only-export-components
export const Select: typeof SelectPrimitive.Root = SelectPrimitive.Root

export interface SelectButtonProps extends useRender.ComponentProps<'button'> {
  size?: VariantProps<typeof selectTriggerVariants>['size']
}

export function SelectButton({
  className,
  size,
  render,
  children,
  ...props
}: SelectButtonProps): React.ReactElement {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>['type']
    = render ? undefined : 'button'

  const defaultProps = {
    'children': (
      <>
        <span className="
          flex-1 truncate
          in-data-placeholder:text-muted-foreground/72
        "
        >
          {children}
        </span>
        <ChevronsUpDownIcon className={selectTriggerIconClassName} />
      </>
    ),
    'className': cn(selectTriggerVariants({ size }), 'min-w-0', className),
    'data-slot': 'select-button',
    'type': typeValue,
  }

  return useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(defaultProps, props),
    render,
  })
}

export function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: SelectPrimitive.Trigger.Props & VariantProps<typeof selectTriggerVariants>): React.ReactElement {
  return (
    <SelectPrimitive.Trigger
      className={cn(selectTriggerVariants({ size }), className)}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon data-slot="select-icon">
        <ChevronsUpDownIcon className={selectTriggerIconClassName} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectValue({
  className,
  ...props
}: SelectPrimitive.Value.Props): React.ReactElement {
  return (
    <SelectPrimitive.Value
      className={cn(
        `
          flex-1 truncate
          data-placeholder:text-muted-foreground
        `,
        className,
      )}
      data-slot="select-value"
      {...props}
    />
  )
}

export function SelectPopup({
  className,
  children,
  side = 'bottom',
  sideOffset = 4,
  align = 'start',
  alignOffset = 0,
  alignItemWithTrigger = true,
  anchor,
  ...props
}: SelectPrimitive.Popup.Props & {
  side?: SelectPrimitive.Positioner.Props['side']
  sideOffset?: SelectPrimitive.Positioner.Props['sideOffset']
  align?: SelectPrimitive.Positioner.Props['align']
  alignOffset?: SelectPrimitive.Positioner.Props['alignOffset']
  alignItemWithTrigger?: SelectPrimitive.Positioner.Props['alignItemWithTrigger']
  anchor?: SelectPrimitive.Positioner.Props['anchor']
}): React.ReactElement {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        alignOffset={alignOffset}
        anchor={anchor}
        className="z-50 select-none"
        data-slot="select-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          className="origin-(--transform-origin) text-foreground outline-none"
          data-slot="select-popup"
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow
            className="
              top-0 z-50 flex h-6 w-full cursor-default items-center
              justify-center
              before:pointer-events-none before:absolute
              before:inset-x-(--border-hairline) before:top-(--border-hairline)
              before:h-[200%]
              before:rounded-t-[calc(var(--radius-lg)-var(--border-hairline))]
              before:bg-linear-to-b before:from-popover before:from-50%
            "
            data-slot="select-scroll-up-arrow"
          >
            <ChevronUpIcon className="
              relative size-4.5
              sm:size-4
            "
            />
          </SelectPrimitive.ScrollUpArrow>
          <div className="
            relative h-full min-w-(--anchor-width) rounded-lg border bg-popover
            shadow-lg/5
            not-dark:bg-clip-padding
            before:pointer-events-none before:absolute before:inset-0
            before:rounded-[calc(var(--radius-lg)-var(--border-hairline))]
            before:shadow-[0_var(--border-hairline)_--theme(--color-black/4%)]
            dark:before:shadow-[0_-var(--border-hairline)_--theme(--color-white/6%)]
          "
          >
            <SelectPrimitive.List
              className={cn(
                'max-h-(--available-height) overflow-y-auto p-1',
                className,
              )}
              data-slot="select-list"
            >
              {children}
            </SelectPrimitive.List>
          </div>
          <SelectPrimitive.ScrollDownArrow
            className="
              bottom-0 z-50 flex h-6 w-full cursor-default items-center
              justify-center
              before:pointer-events-none before:absolute
              before:inset-x-(--border-hairline)
              before:bottom-(--border-hairline) before:h-[200%]
              before:rounded-b-[calc(var(--radius-lg)-var(--border-hairline))]
              before:bg-linear-to-t before:from-popover before:from-50%
            "
            data-slot="select-scroll-down-arrow"
          >
            <ChevronDownIcon className="
              relative size-4.5
              sm:size-4
            "
            />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props): React.ReactElement {
  return (
    <SelectPrimitive.Item
      className={cn(
        `
          grid min-h-8 cursor-default grid-cols-[1rem_1fr] items-center gap-2
          rounded-sm py-1 ps-2 pe-4 text-base outline-none
          in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)]
          data-disabled:pointer-events-none data-disabled:opacity-64
          data-highlighted:bg-accent data-highlighted:text-accent-foreground
          sm:min-h-7 sm:text-sm
          [&_svg]:pointer-events-none [&_svg]:shrink-0
          [&_svg:not([class*='size-'])]:size-4.5
          sm:[&_svg:not([class*='size-'])]:size-4
        `,
        className,
      )}
      data-slot="select-item"
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="col-start-1">
        <svg
          aria-hidden="true"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText className="col-start-2 min-w-0">
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props): React.ReactElement {
  return (
    <SelectPrimitive.Separator
      className={cn('mx-2 my-1 h-(--border-hairline) bg-border', className)}
      data-slot="select-separator"
      {...props}
    />
  )
}

export function SelectGroup(
  props: SelectPrimitive.Group.Props,
): React.ReactElement {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

export function SelectLabel({
  className,
  ...props
}: SelectPrimitive.Label.Props): React.ReactElement {
  return (
    <SelectPrimitive.Label
      className={cn(
        `
          inline-flex cursor-default items-center gap-2 text-base/4.5
          font-medium text-foreground
          not-in-data-[slot=field]:mb-2
          sm:text-sm/4
        `,
        className,
      )}
      data-slot="select-label"
      {...props}
    />
  )
}

export function SelectGroupLabel(
  props: SelectPrimitive.GroupLabel.Props,
): React.ReactElement {
  return (
    <SelectPrimitive.GroupLabel
      className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      data-slot="select-group-label"
      {...props}
    />
  )
}

export { SelectPopup as SelectContent }
