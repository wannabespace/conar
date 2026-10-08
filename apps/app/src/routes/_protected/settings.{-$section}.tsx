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
  useCanGoBack,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useRef } from 'react'

import { SidebarMenuButton } from '~/components/sidebar-menu-button'
import { settingsSections } from '~/core/settings/sections'
import { pressNavProps } from '~/lib/press-nav'
import {
  resourcePanelClassName,
  settingsPageClassName,
  settingsSidebarClassName,
} from '~/shell'

const { useParams } = getRouteApi('/_protected/settings/{-$section}')

const SettingsPage = () => {
  const { section } = useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const navRef = useRef<HTMLElement>(null)
  const sections = settingsSections()
  const activeIndex = Math.max(
    sections.findIndex(({ id }) => id === section),
    0
  )
  const active = sections[activeIndex]
  const openSection = (index: number) => {
    const next = sections[index]
    if (next) {
      void navigate({
        params: { section: next.id },
        replace: true,
        to: '/settings/{-$section}',
      })
    }
  }

  const leave = () => {
    if (canGoBack) {
      router.history.back()
    } else {
      void navigate({ to: '/' })
    }
  }
  const stepSection = (step: number) => {
    navRef.current?.querySelectorAll('button')[activeIndex + step]?.focus()
    openSection(activeIndex + step)
  }

  useHotkey('Escape', leave)
  useHotkey('ArrowDown', () => stepSection(1), { target: navRef })
  useHotkey('ArrowUp', () => stepSection(-1), { target: navRef })

  return (
    <div className={settingsPageClassName}>
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
              isActive={index === activeIndex}
              autoFocus={index === activeIndex}
              {...pressNavProps(() => openSection(index))}
            >
              <HugeiconsIcon
                icon={icon}
                strokeWidth={2}
                className={
                  index === activeIndex
                    ? 'text-primary-foreground'
                    : 'text-primary/75'
                }
              />
              {label}
            </SidebarMenuButton>
          ))}
        </nav>
      </aside>
      {active && (
        <div className={resourcePanelClassName}>
          <ScrollArea className="min-h-0 flex-1">
            <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-8 py-10">
              <h1 className="px-3.5 text-xl font-semibold">{active.label}</h1>
              <active.Component />
            </section>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_protected/settings/{-$section}')({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: title('Settings') }],
  }),
})
