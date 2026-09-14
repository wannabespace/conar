import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Label } from '@tamery/ui/components/label'
import { Separator } from '@tamery/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { createContext, use } from 'react'

const FieldInvalidContext = createContext<React.ReactNode>(null)

const FieldInvalidProvider = FieldInvalidContext.Provider

const useFieldInvalidMark = () => use(FieldInvalidContext)

const FieldSet = ({
  className,
  ...props
}: React.ComponentProps<'fieldset'>) => (
  <fieldset
    data-slot="field-set"
    className={cn(
      `flex flex-col gap-6 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3`,
      className
    )}
    {...props}
  />
)

const FieldLegend = ({
  className,
  variant = 'legend',
  ...props
}: React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }) => (
  <legend
    data-slot="field-legend"
    data-variant={variant}
    className={cn(
      `mb-3 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base`,
      className
    )}
    {...props}
  />
)

const fieldGroupVariants = cva(
  `group/field-group @container/field-group flex w-full flex-col data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4`,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'gap-6',
        sm: 'gap-4',
      },
    },
  }
)

const FieldGroup = ({
  className,
  size,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof fieldGroupVariants>) => (
  <div
    data-slot="field-group"
    className={cn(fieldGroupVariants({ size }), className)}
    {...props}
  />
)

const fieldVariants = cva(`group/field flex w-full`, {
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: {
      horizontal: `flex-row items-center gap-3 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px`,
      responsive: `flex-col gap-1.5 *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-3 @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px`,
      vertical: `flex-col gap-1.5 *:w-full [&>.sr-only]:w-auto`,
    },
  },
})

const Field = ({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<'fieldset'> & VariantProps<typeof fieldVariants>) => (
  <fieldset
    data-slot="field"
    data-orientation={orientation}
    className={cn(
      'm-0 min-w-0 border-0 p-0',
      fieldVariants({ orientation }),
      className
    )}
    {...props}
  />
)

const FieldContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="field-content"
    className={cn(
      'group/field-content flex flex-1 flex-col gap-0.5 leading-snug',
      className
    )}
    {...props}
  />
)

const FieldLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof Label>) => (
  <Label
    data-slot="field-label"
    className={cn(
      `group/field-label peer/field-label has-data-checked:bg-input/30 flex w-fit gap-2 leading-snug transition-colors group-data-[disabled=true]/field:opacity-50`,
      // A label wrapping a Field is a choice-card. Hover firms its hairline
      // instead of tinting the fill: in light theme the card is white on a
      // near-white pane, so a tint drops it below the pane and reads as a hole.
      `has-[>[data-slot=field]]:bg-input has-[>[data-slot=field]]:ring-foreground/4 hover:has-[>[data-slot=field]]:ring-foreground/12 has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:border-transparent has-[>[data-slot=field]]:shadow-xs has-[>[data-slot=field]]:ring-[0.5px] has-[>[data-slot=field]]:transition-shadow has-[>[data-slot=field]]:has-[:disabled]:opacity-50 *:data-[slot=field]:p-3`,
      className
    )}
    {...props}
  />
)

const FieldTitle = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="field-label"
    className={cn(
      `flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50`,
      className
    )}
    {...props}
  />
)

const fieldDescriptionVariants = cva(
  `text-muted-foreground [&>a:hover]:text-primary text-left font-normal group-has-data-[orientation=horizontal]/field:text-balance last:mt-0 nth-last-2:-mt-1 [&>a]:underline [&>a]:underline-offset-4 [[data-variant=legend]+&]:-mt-1.5`,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'text-sm/normal',
        sm: 'text-xs/normal',
      },
    },
  }
)

const FieldDescription = ({
  className,
  size,
  ...props
}: React.ComponentProps<'p'> &
  VariantProps<typeof fieldDescriptionVariants>) => (
  <p
    data-slot="field-description"
    className={cn(fieldDescriptionVariants({ size }), className)}
    {...props}
  />
)

const FieldSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  children?: React.ReactNode
}) => (
  <div
    data-slot="field-separator"
    data-content={!!children}
    className={cn(
      `relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2`,
      className
    )}
    {...props}
  >
    <Separator className="absolute inset-0 top-1/2" />
    {children && (
      <span
        className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
        data-slot="field-separator-content"
      >
        {children}
      </span>
    )}
  </div>
)

type FieldErrorItem = { message?: string } | undefined

const fieldErrorContent = (
  children: React.ReactNode,
  errors: FieldErrorItem[] | undefined
) => {
  if (children) {
    return children
  }

  const messages = errors?.flatMap((item) => item?.message ?? [])

  return messages?.length ? [...new Set(messages)].join(' · ') : null
}

const FieldError = ({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'span'> & {
  errors?: ({ message?: string } | undefined)[]
}) => {
  const content = fieldErrorContent(children, errors)

  if (!content) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="alert"
            data-slot="field-error"
            className={cn(
              'text-destructive inline-flex shrink-0 items-center',
              className
            )}
            {...props}
          >
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
            <span className="sr-only">{content}</span>
          </span>
        }
      />
      <TooltipContent>
        <span className="block text-pretty">{content}</span>
      </TooltipContent>
    </Tooltip>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldInvalidProvider,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  useFieldInvalidMark,
}
