import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { cn } from '@tamery/ui/lib/utils'
import type { LinkProps } from '@tanstack/react-router'
import { Link, useMatchRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export const SidebarButton = ({
  active = false,
  className,
  ...props
}: {
  active?: boolean
} & React.ComponentProps<typeof Button>) => (
  <Button
    variant="ghost"
    className={cn(`w-full justify-start`, active && `bg-accent/50`, className)}
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
}) => {
  const matchRoute = useMatchRoute()

  return (
    <SidebarButton active={!!matchRoute({ to })} render={<Link to={to} />}>
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
      {children}
    </SidebarButton>
  )
}
