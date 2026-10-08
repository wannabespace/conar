import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { title } from '@tamery/shared/title'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { Kbd } from '@tamery/ui/components/kbd'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useHotkey } from '@tanstack/react-hotkeys'
import {
  createFileRoute,
  getRouteApi,
  Outlet,
  useCanGoBack,
  useLocation,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useRef } from 'react'

import { SidebarMenuButton } from '~/components/sidebar'
import { settingsSections } from '~/core/settings/sections'
import type { SettingsSection } from '~/lib/module'
import { pressNavProps } from '~/lib/press-nav'
import {
  resourcePanelClassName,
  settingsPageClassName,
  settingsSidebarClassName,
} from '~/shell'

const routeApi = getRouteApi('/_protected/settings')

const SettingsPage = () => {
  const { sections } = routeApi.useLoaderData()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const pageRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const activeIndex = sections.findIndex(({ to }) => to === pathname)
  const openSection = (to: SettingsSection['to']) => {
    void navigate({ replace: true, to })
  }
  const stepSection = (step: number) => {
    const next = sections[activeIndex + step]
    if (next) {
      navRef.current
        ?.querySelector<HTMLElement>(`[data-section="${next.to}"]`)
        ?.focus()
      openSection(next.to)
    }
  }

  const leave = () => {
    if (canGoBack) {
      router.history.back()
    } else {
      void navigate({ to: '/' })
    }
  }

  // Scoped to the page, not the document: Escape inside a portalled popup (a Select, an MCP approval) must close only that popup. The page's tabIndex keeps a click on empty space inside the scope.
  useHotkey('Escape', leave, { target: pageRef })
  useHotkey('ArrowDown', () => stepSection(1), { target: navRef })
  useHotkey('ArrowUp', () => stepSection(-1), { target: navRef })

  return (
    <div ref={pageRef} tabIndex={-1} className={settingsPageClassName}>
      <aside className={settingsSidebarClassName}>
        <Tooltip shortcut={<Kbd>Esc</Kbd>}>
          <TooltipTrigger
            render={<SidebarMenuButton {...pressNavProps(leave)} />}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              className="text-muted-foreground"
            />
            Back to app
          </TooltipTrigger>
          <TooltipContent side="right">Back to app</TooltipContent>
        </Tooltip>
        <nav ref={navRef} className="flex flex-col gap-0.5">
          {sections.map(({ icon, label, to }, index) => (
            <SidebarMenuButton
              key={to}
              data-section={to}
              isActive={index === activeIndex}
              autoFocus={index === activeIndex}
              {...pressNavProps(() => openSection(to))}
            >
              <HugeiconsIcon
                icon={icon}
                strokeWidth={2}
                className="text-primary/75"
              />
              {label}
            </SidebarMenuButton>
          ))}
        </nav>
      </aside>
      <div className={resourcePanelClassName}>
        <ScrollArea className="min-h-0 flex-1">
          <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-8 py-10">
            <h1 className="px-3.5 text-xl font-semibold">
              {sections[activeIndex]?.label}
            </h1>
            <Outlet />
          </section>
        </ScrollArea>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_protected/settings')({
  loader: () => ({ sections: settingsSections() }),
  component: SettingsPage,
  head: () => ({
    meta: [{ title: title('Settings') }],
  }),
})
