import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { SidebarMenuButton } from '@tamery/ui/components/sidebar'
import type { LinkProps } from '@tanstack/react-router'
import { Link, useMatchRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export const SidebarIcon = ({ icon }: { icon: IconSvgElement }) => (
  <HugeiconsIcon icon={icon} strokeWidth={2} className="text-primary/75" />
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
    <SidebarMenuButton
      className="w-auto shrink-0 md:w-full"
      isActive={!!matchRoute({ to })}
      render={<Link to={to} />}
    >
      <SidebarIcon icon={icon} />
      {children}
    </SidebarMenuButton>
  )
}
