import { HugeiconsIcon } from '@hugeicons/react'
import { title } from '@tamery/shared/title'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { useHotkey } from '@tanstack/react-hotkeys'
import {
  createFileRoute,
  getRouteApi,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { type } from 'arktype'

import { SidebarButton } from '~/components/sidebar-link'
import { pressNavProps } from '~/lib/press-nav'
import { protectedModules } from '~/lib/protected-modules'
import { centeredPageClassName } from '~/shell'

const { useSearch } = getRouteApi('/_protected/settings')

const SettingsPage = () => {
  const { section } = useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const sections = protectedModules.settings
  const active = sections.find(({ id }) => id === section) ?? sections[0]

  useHotkey('Escape', () => router.history.back())

  return (
    <ScrollArea className="overflow-auto">
      <div className={centeredPageClassName}>
        <div className="flex gap-8">
          <nav className="flex w-40 shrink-0 flex-col gap-0.5">
            {sections.map(({ icon, id, label }) => (
              <SidebarButton
                key={id}
                active={id === active?.id}
                {...pressNavProps(() =>
                  navigate({ search: { section: id }, to: '/settings' })
                )}
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
  component: SettingsPage,
  head: () => ({
    meta: [{ title: title('Settings') }],
  }),
  validateSearch: type({
    'section?': 'string',
  }),
})
