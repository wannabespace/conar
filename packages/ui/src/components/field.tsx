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
import { createContext, use, useEffect, useState } from 'react'

import {
  fieldDescriptionVariants,
  fieldGroupVariants,
  fieldVariants,
} from './field.utils'

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
      `has-[>[data-slot=field]]:bg-input has-[>[data-slot=field]]:ring-foreground/4 hover:has-[>[data-slot=field]]:ring-foreground/12 has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:border-transparent has-[>[data-slot=field]]:shadow-xs has-[>[data-slot=field]]:ring has-[>[data-slot=field]]:transition-shadow has-[>[data-slot=field]]:has-[:disabled]:opacity-50 *:data-[slot=field]:p-3`,
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

const ERROR_PEEK_MS = 3000

const FieldError = ({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'button'> & {
  errors?: ({ message?: string } | undefined)[]
}) => {
  const content = fieldErrorContent(children, errors)
  const [seen, setSeen] = useState<React.ReactNode>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (hovered) {
      return
    }
    const timeout = setTimeout(() => setSeen(content), ERROR_PEEK_MS)

    return () => clearTimeout(timeout)
  }, [content, hovered])

  if (!content) {
    return null
  }

  const engage = (next: boolean) => {
    setHovered(next)
    if (!next) {
      setSeen(content)
    }
  }

  return (
    <Tooltip open={hovered || seen !== content} onOpenChange={engage}>
      <TooltipTrigger
        render={
          <button
            type="button"
            data-slot="field-error"
            onPointerEnter={() => engage(true)}
            onPointerLeave={() => engage(false)}
            className={cn(
              `text-destructive focus-visible:focus-ring inline-flex shrink-0 items-center rounded-full outline-none`,
              className
            )}
            {...props}
          >
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
            <span role="alert" className="sr-only">
              {content}
            </span>
          </button>
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
