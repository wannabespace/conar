import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { Separator } from '@tamery/ui/components/separator'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'

import { buttonGroupVariants } from './button-group.utils'

const ButtonGroup = ({
  className,
  orientation,
  ...props
}: React.ComponentProps<'fieldset'> &
  VariantProps<typeof buttonGroupVariants>) => (
  <fieldset
    data-slot="button-group"
    data-orientation={orientation}
    className={cn(
      'm-0 min-w-0 border-0 p-0',
      buttonGroupVariants({ orientation }),
      className
    )}
    {...props}
  />
)

const ButtonGroupText = ({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>) =>
  useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          `bg-muted flex items-center gap-2 rounded-2xl border px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4`,
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: 'button-group-text',
    },
  })

const ButtonGroupSeparator = ({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof Separator>) => (
  <Separator
    data-slot="button-group-separator"
    orientation={orientation}
    className={cn(
      `bg-input relative self-stretch data-[orientation=horizontal]:mx-px data-[orientation=horizontal]:w-auto data-[orientation=vertical]:my-px data-[orientation=vertical]:h-auto`,
      className
    )}
    {...props}
  />
)

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText }
