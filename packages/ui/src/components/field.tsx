import { Label } from '@tamery/ui/components/label'
import { Separator } from '@tamery/ui/components/separator'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { useMemo } from 'react'

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

const FieldGroup = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="field-group"
    className={cn(
      `group/field-group @container/field-group flex w-full flex-col gap-6 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4`,
      className
    )}
    {...props}
  />
)

const fieldVariants = cva(
  `group/field data-[invalid=true]:text-destructive flex w-full gap-3`,
  {
    defaultVariants: {
      orientation: 'vertical',
    },
    variants: {
      orientation: {
        horizontal: `flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px`,
        responsive: `flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px`,
        vertical: `flex-col *:w-full [&>.sr-only]:w-auto`,
      },
    },
  }
)

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
      'group/field-content flex flex-1 flex-col gap-1 leading-snug',
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
      `group/field-label peer/field-label has-data-checked:bg-input/30 flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-[>[data-slot=field]]:rounded-2xl has-[>[data-slot=field]]:border *:data-[slot=field]:p-4`,
      'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col',
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

const FieldDescription = ({
  className,
  ...props
}: React.ComponentProps<'p'>) => (
  <p
    data-slot="field-description"
    className={cn(
      `text-muted-foreground text-left text-sm/normal font-normal group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5`,
      `last:mt-0 nth-last-2:-mt-1`,
      `[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4`,
      className
    )}
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

const FieldError = ({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: ({ message?: string } | undefined)[]
}) => {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length === 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            // oxlint-disable-next-line react/no-array-index-key
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn('text-destructive text-sm font-normal', className)}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}
