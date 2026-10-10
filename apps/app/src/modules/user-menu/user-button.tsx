import {
  BrushIcon,
  DiscordIcon,
  GithubIcon,
  Globe02Icon,
  HistoryIcon,
  Login03Icon,
  Logout03Icon,
  Message01Icon,
  NewTwitterIcon,
  Settings02Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { RELEASES_URL, SOCIAL_LINKS } from '@tamery/shared/constants'
import { Button } from '@tamery/ui/components/button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import { UserAvatar } from '@tamery/ui/components/custom/user-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import type { Theme } from '@tamery/ui/theme-store'
import { themeStore, useTheme } from '@tamery/ui/theme-store'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { Link } from '~/components/link'
import { authClient } from '~/lib/auth'
import { ANALYTICS_STORAGE_KEY } from '~/lib/posthog'
import { clearDb } from '~/lib/sync'
import { accountUrl } from '~/lib/urls'

import { SupportDialog } from './support-dialog'
import { useSignOut } from './use-sign-out'

const clearLocalAppCache = async () => {
  const dbs = await indexedDB.databases()
  for (const db of dbs) {
    if (db.name) {
      indexedDB.deleteDatabase(db.name)
    }
  }

  await clearDb()
  for (const key of Object.keys(localStorage)) {
    if (!key.includes('bearer_token') && key !== ANALYTICS_STORAGE_KEY) {
      localStorage.removeItem(key)
    }
  }
}

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { label: 'System', value: 'system' },
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
]

const SOCIAL_ROWS = [
  { href: 'https://tamery.app', icon: Globe02Icon, label: 'Website' },
  { href: SOCIAL_LINKS.TWITTER, icon: NewTwitterIcon, label: 'X' },
  { href: SOCIAL_LINKS.DISCORD, icon: DiscordIcon, label: 'Discord' },
  { href: SOCIAL_LINKS.GITHUB, icon: GithubIcon, label: 'GitHub' },
] as const

export const UserButton = ({
  side = 'right',
  align = 'end',
}: {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
} = {}) => {
  const { signOut, isSigningOut } = useSignOut()
  const { data } = authClient.useSession()
  const theme = useTheme()
  const [isSupportOpen, setIsSupportOpen] = useState(false)

  const { mutate: clearLocalCache, isPending: isClearingCache } = useMutation({
    meta: { event: 'local_cache_cleared' },
    mutationFn: clearLocalAppCache,
    onError: (err) => {
      console.error(err)
      toast.error('Failed to clear cache')
    },
    onSuccess: () => {
      toast.success('Local cache cleared. Reloading...')
      window.location.reload()
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className="size-5 cursor-default rounded-sm"
      >
        <UserAvatar className="size-full" user={data?.user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56" side={side} align={align}>
        <div className="flex flex-col px-2 py-1.5 leading-tight">
          <span className="text-sm font-medium">{data?.user.name}</span>
          {!data?.user.isAnonymous && (
            <span className="text-muted-foreground text-xs">
              {data?.user.email}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        {data?.user.isAnonymous ? (
          <DropdownMenuItem render={<Link to="/auth" activateOn="click" />}>
            <HugeiconsIcon icon={Login03Icon} strokeWidth={2} />
            Sign in
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => window.open(accountUrl, '_blank')}>
            <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
            Account
          </DropdownMenuItem>
        )}
        <DropdownMenuItem render={<Link to="/settings" activateOn="click" />}>
          <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
          Settings
          <DropdownMenuShortcut>
            <KbdCtrlLetter userAgent={navigator.userAgent} letter="," />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        {window.electron && (
          <DropdownMenuItem
            onClick={() =>
              window.open(import.meta.env.VITE_PUBLIC_WEB_URL, '_blank')
            }
          >
            <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} />
            Web app
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => window.open(RELEASES_URL, '_blank')}>
          <HugeiconsIcon icon={HistoryIcon} strokeWidth={2} />
          Releases
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsSupportOpen(true)}>
          <HugeiconsIcon icon={Message01Icon} strokeWidth={2} />
          Support
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isSigningOut || isClearingCache}
          onClick={() => clearLocalCache()}
        >
          <HugeiconsIcon icon={BrushIcon} strokeWidth={2} />
          Clear cache
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          {THEME_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              closeOnClick={false}
              onClick={() => themeStore.set(option.value)}
            >
              <span
                aria-hidden
                className="flex size-4 items-center justify-center"
              >
                {theme === option.value && (
                  <span className="bg-foreground size-1.5 rounded-full" />
                )}
              </span>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isSigningOut} onClick={() => signOut()}>
          <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
          Sign out
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="text-muted-foreground flex items-center gap-1 px-1 py-0.5">
          {SOCIAL_ROWS.map((social) => (
            <Tooltip key={social.label}>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost-tint"
                    size="icon-xs"
                    aria-label={social.label}
                    onClick={() => window.open(social.href, '_blank')}
                  />
                }
              >
                <HugeiconsIcon
                  icon={social.icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">{social.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </DropdownMenuContent>
      <SupportDialog open={isSupportOpen} onOpenChange={setIsSupportOpen} />
    </DropdownMenu>
  )
}
