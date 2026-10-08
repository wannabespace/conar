import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { title } from '@tamery/shared/title'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { smallItemInsetClassName } from '@tamery/ui/components/item'
import { Kbd } from '@tamery/ui/components/kbd'
import { SidebarMenuButton } from '@tamery/ui/components/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import {
  createFileRoute,
  Outlet,
  useCanGoBack,
  useNavigate,
  useParams,
  useRouter,
} from '@tanstack/react-router'
import { useRef } from 'react'

import { settingsSections } from '~/core/settings/sections'
import {
  resourcePanelClassName,
  settingsPageClassName,
  settingsSidebarClassName,
} from '~/shell'
import { pressNavProps } from '~/utils/press-nav'

const SettingsPage = () => {
  const { section } = useParams({ strict: false })
  const navigate = useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const pageRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const activeIndex = settingsSections.findIndex(({ slug }) => slug === section)
  const openSection = (slug: string) => {
    void navigate({
      params: { section: slug },
      replace: true,
      to: '/settings/$section',
    })
  }
  const stepSection = (step: number) => {
    const next = settingsSections[activeIndex + step]
    if (next) {
      navRef.current
        ?.querySelector<HTMLElement>(`[data-section="${next.slug}"]`)
        ?.focus()
      openSection(next.slug)
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
          {settingsSections.map(({ icon, label, slug }, index) => (
            <SidebarMenuButton
              key={slug}
              data-section={slug}
              isActive={index === activeIndex}
              autoFocus={index === activeIndex}
              {...pressNavProps(() => openSection(slug))}
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
            <h1
              className={cn(smallItemInsetClassName, 'text-xl font-semibold')}
            >
              {settingsSections[activeIndex]?.label}
            </h1>
            <Outlet />
          </section>
        </ScrollArea>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_protected/settings')({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: title('Settings') }],
  }),
})
