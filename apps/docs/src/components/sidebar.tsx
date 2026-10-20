import { Button } from '@tamery/ui/components/button'
import { SidebarMenuButton } from '@tamery/ui/components/sidebar'
import { cn } from '@tamery/ui/lib/utils'
import { Link, useRouterState } from '@tanstack/react-router'

import { nav } from '~/lib/nav'

import { DocsLink, docsLinkProps } from './docs-link'

const usePathname = () =>
  useRouterState({ select: (state) => state.location.pathname })

export const SectionTabs = ({ className }: { className?: string }) => {
  const activeTab = nav.getActiveTab(usePathname())

  return (
    <nav
      aria-label="Documentation sections"
      className={cn('flex items-center gap-0.5', className)}
    >
      {nav.tabs.map((tab) => (
        <Button
          key={tab.label}
          render={
            <Link {...docsLinkProps(tab.groups[0]?.pages[0]?.href ?? '/')} />
          }
          size="sm"
          variant={tab === activeTab ? 'secondary' : 'ghost-muted'}
        >
          {tab.label}
        </Button>
      ))}
    </nav>
  )
}

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname()
  const tab = nav.getActiveTab(pathname)

  if (!tab) {
    return null
  }

  return (
    <nav aria-label={tab.label} className="flex flex-col gap-5">
      {tab.groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-0.5">
          {group.title !== tab.label && (
            <p className="text-muted-foreground px-2 pb-1 text-xs font-medium">
              {group.title}
            </p>
          )}
          {group.pages.map((page) => {
            const current = page.href === pathname

            return (
              <SidebarMenuButton
                key={page.href}
                isActive={current}
                render={
                  <DocsLink
                    aria-current={current ? 'page' : undefined}
                    href={page.href}
                    onClick={onNavigate}
                  />
                }
                variant={current ? 'default' : 'muted'}
              >
                {page.title}
              </SidebarMenuButton>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
