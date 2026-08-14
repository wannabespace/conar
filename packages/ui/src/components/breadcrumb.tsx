import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { RiArrowRightSLine, RiMoreLine } from '@remixicon/react'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

const Breadcrumb = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    aria-label="breadcrumb"
    data-slot="breadcrumb"
    className={cn(className)}
    {...props}
  />
)

const BreadcrumbList = ({
  className,
  ...props
}: React.ComponentProps<'ol'>) => (
  <ol
    data-slot="breadcrumb-list"
    className={cn(
      `text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm wrap-break-word sm:gap-2.5`,
      className
    )}
    {...props}
  />
)

const BreadcrumbItem = ({
  className,
  ...props
}: React.ComponentProps<'li'>) => (
  <li
    data-slot="breadcrumb-item"
    className={cn('inline-flex items-center gap-1.5', className)}
    {...props}
  />
)

const BreadcrumbLink = ({
  className,
  render,
  ...props
}: useRender.ComponentProps<'a'>) =>
  useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      {
        className: cn(`hover:text-foreground transition-colors`, className),
      },
      props
    ),
    render,
    state: {
      slot: 'breadcrumb-link',
    },
  })

const BreadcrumbPage = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    data-slot="breadcrumb-page"
    aria-disabled="true"
    aria-current="page"
    className={cn('text-foreground font-normal', className)}
    {...props}
  />
)

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<'li'>) => (
  <li
    data-slot="breadcrumb-separator"
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:size-3.5', className)}
    {...props}
  >
    {children ?? <RiArrowRightSLine />}
  </li>
)

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    data-slot="breadcrumb-ellipsis"
    role="presentation"
    aria-hidden="true"
    className={cn(
      `flex size-5 items-center justify-center [&>svg]:size-4`,
      className
    )}
    {...props}
  >
    <RiMoreLine />
    <span className="sr-only">More</span>
  </span>
)

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
