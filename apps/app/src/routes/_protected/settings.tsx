import { HugeiconsIcon } from '@hugeicons/react'
import { title } from '@tamery/shared/title'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { useHotkey } from '@tanstack/react-hotkeys'
import {
  createFileRoute,
  getRouteApi,
  redirect,
  useCanGoBack,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { type } from 'arktype'
import { useRef } from 'react'

import { SidebarButton } from '~/components/sidebar-link'
import { pressNavProps } from '~/lib/press-nav'
import { protectedModules } from '~/lib/protected-modules'
import { centeredPageClassName } from '~/shell'

const { useSearch } = getRouteApi('/_protected/settings')

const SettingsPage = () => {
  const { section } = useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const navRef = useRef<HTMLElement>(null)
  const sections = protectedModules.settings
  const activeIndex = Math.max(
    sections.findIndex(({ id }) => id === section),
    0
  )
  const active = sections[activeIndex]
  const openSection = (index: number) => {
    const next = sections[index]
    if (next) {
      void navigate({
        replace: true,
        search: { section: next.id },
        to: '/settings',
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
    <ScrollArea className="overflow-auto">
      <div className={centeredPageClassName}>
        <div className="flex gap-8">
          <nav ref={navRef} className="flex w-40 shrink-0 flex-col gap-0.5">
            {sections.map(({ icon, id, label }, index) => (
              <SidebarButton
                key={id}
                active={index === activeIndex}
                autoFocus={index === activeIndex}
                {...pressNavProps(() => openSection(index))}
              >
                <HugeiconsIcon icon={icon} strokeWidth={2} />
                {label}
              </SidebarButton>
            ))}
          </nav>
          {active && (
            <section className="flex min-w-0 flex-1 flex-col gap-4">
              <h1 className="text-lg font-semibold">{active.label}</h1>
              <active.Component />
            </section>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

export const Route = createFileRoute('/_protected/settings')({
  beforeLoad: () => {
    if (protectedModules.settings.length === 0) {
      throw redirect({ to: '/' })
    }
  },
  component: SettingsPage,
  head: () => ({
    meta: [{ title: title('Settings') }],
  }),
  validateSearch: type({
    'section?': 'string',
  }),
})
