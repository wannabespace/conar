import { CrownIcon, Logout01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@tamery/ui/components/button'
import { UserAvatar } from '@tamery/ui/components/custom/user-avatar'
import { SidebarMenuButton } from '@tamery/ui/components/sidebar'
import {
  createFileRoute,
  getRouteApi,
  Link,
  Outlet,
  redirect,
  useRouter,
} from '@tanstack/react-router'

import { Brand } from '~/components/brand'
import { GithubStars } from '~/components/github-stars'
import { SidebarIcon, SidebarLink } from '~/components/sidebar-button'
import { ThemeButton } from '~/components/theme-button'
import { authClient } from '~/lib/auth'
import { AiUsageLink } from '~/modules/ai-usage/ai-usage-link'
import { ApiKeysLink } from '~/modules/api-keys/api-keys-link'
import { BillingLink } from '~/modules/billing/billing-link'
import { SettingsLink } from '~/modules/settings/settings-link'
import { SupportButton } from '~/modules/support/support-button'

const { useRouteContext } = getRouteApi('/account')

const AccountLayout = () => {
  const router = useRouter()
  const { user } = useRouteContext()

  const signOut = async () => {
    await authClient.signOut()
    await router.invalidate()
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4 md:px-5">
        <div className="flex flex-1 items-center">
          <Brand to="/home" />
        </div>
        <GithubStars className="hidden sm:inline-flex" />
        <ThemeButton />
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          render={
            <a
              href={import.meta.env.VITE_PUBLIC_WEB_URL}
              aria-label="Open web app"
            />
          }
        >
          Open web app
        </Button>
        <Button size="sm" render={<Link to="/download" />}>
          Download
        </Button>
      </header>
      <div className="flex min-w-0 flex-1 flex-col gap-2 px-2 pb-2 md:flex-row">
        <aside className="flex min-w-0 shrink-0 flex-col gap-4 md:sticky md:top-2 md:w-64 md:self-start md:py-2 md:pr-1.5 md:pl-2">
          <div className="hidden items-center gap-3 px-2 md:flex">
            <UserAvatar user={user} className="size-9" />
            <div className="flex min-w-0 flex-col">
              <p data-mask className="truncate text-sm font-medium">
                {user.name}
              </p>
              <p data-mask className="text-muted-foreground truncate text-xs">
                {user.email}
              </p>
            </div>
          </div>
          <nav
            aria-label="Account"
            className="flex gap-0.5 overflow-x-auto px-2 md:flex-col md:overflow-visible md:px-0"
          >
            <SidebarLink to="/account" icon={CrownIcon}>
              Subscription
            </SidebarLink>
            <BillingLink />
            <AiUsageLink />
            <ApiKeysLink />
            <SettingsLink />
            <SupportButton />
            <SidebarMenuButton
              className="w-auto shrink-0 md:w-full"
              onClick={() => {
                void signOut()
              }}
            >
              <SidebarIcon icon={Logout01Icon} />
              Sign out
            </SidebarMenuButton>
          </nav>
        </aside>
        <main className="bg-background ring-foreground/4 min-w-0 flex-1 rounded-2xl ring">
          <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 md:px-8 md:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/account')({
  component: AccountLayout,
  head: () => ({ meta: [{ title: 'Account - Tamery' }] }),
  beforeLoad: async () => {
    const { data } = await authClient.getSession()

    if (!data?.user) {
      throw redirect({ to: '/sign-in' })
    }

    return data
  },
})
