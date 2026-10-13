import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { SidebarMenuButton } from '@tamery/ui/components/sidebar'
import type { LinkProps } from '@tanstack/react-router'
import { Link, useMatchRoute, useRouterState } from '@tanstack/react-router'
import type { ComponentProps, ReactNode } from 'react'

export const SidebarIcon = ({ icon }: { icon: IconSvgElement }) => (
  <HugeiconsIcon icon={icon} strokeWidth={2} className="text-primary/75" />
)

export const SidebarButton = (
  props: ComponentProps<typeof SidebarMenuButton>
) => <SidebarMenuButton {...props} className="w-auto shrink-0 md:w-full" />

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
  const isNavigating = useRouterState({
    select: (state) => state.status === 'pending',
  })
  const isActive = !!matchRoute({ pending: isNavigating, to })

  return (
    <SidebarButton isActive={isActive} render={<Link to={to} />}>
      <SidebarIcon icon={icon} />
      {children}
    </SidebarButton>
  )
}
