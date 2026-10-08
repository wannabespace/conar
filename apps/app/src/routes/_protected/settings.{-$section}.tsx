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
  redirect,
  useCanGoBack,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useRef } from 'react'

import { SidebarMenuButton } from '~/components/sidebar'
import { settingsSections } from '~/core/settings/sections'
import { pressNavProps } from '~/lib/press-nav'
import {
  resourcePanelClassName,
  settingsPageClassName,
  settingsSidebarClassName,
} from '~/shell'

const routeApi = getRouteApi('/_protected/settings/{-$section}')

const SettingsPage = () => {
  const { activeSection, sections } = routeApi.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const pageRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const activeIndex = sections.indexOf(activeSection)
  const openSection = (id: string) => {
    void navigate({
      params: { section: id },
      replace: true,
      to: '/settings/{-$section}',
    })
  }
  const stepSection = (step: number) => {
    const next = sections[activeIndex + step]
    if (next) {
      navRef.current
        ?.querySelector<HTMLElement>(`[data-section="${next.id}"]`)
        ?.focus()
      openSection(next.id)
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
          {sections.map(({ icon, id, label }, index) => (
            <SidebarMenuButton
              key={id}
              data-section={id}
              isActive={index === activeIndex}
              autoFocus={index === activeIndex}
              {...pressNavProps(() => openSection(id))}
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
              {activeSection.label}
            </h1>
            <activeSection.Component />
          </section>
        </ScrollArea>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_protected/settings/{-$section}')({
  loader: ({ params }) => {
    const sections = settingsSections()
    const activeSection = params.section
      ? sections.find(({ id }) => id === params.section)
      : sections[0]
    if (!activeSection) {
      throw redirect({
        params: { section: undefined },
        replace: true,
        to: '/settings/{-$section}',
      })
    }
    return { activeSection, sections }
  },
  component: SettingsPage,
  head: () => ({
    meta: [{ title: title('Settings') }],
  }),
})
