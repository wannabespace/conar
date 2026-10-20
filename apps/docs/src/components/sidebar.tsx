import { cn } from '@tamery/ui/lib/utils'
import { useRouterState } from '@tanstack/react-router'

import { nav } from '~/lib/nav'

import { DocsLink } from './docs-link'

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const tab = nav.getActiveTab(pathname)

  if (!tab) {
    return null
  }

  return (
    <nav aria-label={tab.label} className="flex flex-col gap-5 px-3 py-4">
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
              <DocsLink
                key={page.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'cursor-default rounded-lg px-2 py-1 text-sm',
                  current
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                href={page.href}
                onClick={onNavigate}
              >
                {page.title}
              </DocsLink>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
