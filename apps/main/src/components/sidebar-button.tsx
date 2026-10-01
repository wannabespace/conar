import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { cn } from '@tamery/ui/lib/utils'
import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export const SidebarButton = ({
  className,
  ...props
}: React.ComponentProps<typeof Button>) => (
  <Button
    variant="ghost"
    className={cn(
      // oxlint-disable-next-line shadcn/no-restyle -- the current page's row stays lit
      `not-hover:aria-[current=page]:bg-accent/50 w-full justify-start`,
      className
    )}
    {...props}
  />
)

export const SidebarLink = ({
  children,
  icon,
  to,
}: {
  children: ReactNode
  icon: IconSvgElement
  to: LinkProps['to']
}) => (
  <SidebarButton
    render={
      <Link to={to} activeOptions={{ exact: true, includeSearch: false }} />
    }
  >
    <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
    {children}
  </SidebarButton>
)
