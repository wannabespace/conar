import {
  RiBrushLine,
  RiDiscordLine,
  RiGithubLine,
  RiGlobalLine,
  RiHistoryLine,
  RiLogoutCircleRLine,
  RiMessageLine,
  RiTwitterXLine,
  RiUserLine,
} from '@remixicon/react'
import { RELEASES_URL, SOCIAL_LINKS } from '@tamery/shared/constants'
import { Button } from '@tamery/ui/components/button'
import { UserAvatar } from '@tamery/ui/components/custom/user-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import type { Theme } from '@tamery/ui/theme-store'
import { themeStore, useTheme } from '@tamery/ui/theme-store'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { SupportDialog } from '~/components/support-dialog'
import { authClient } from '~/lib/auth'
import { clearDb } from '~/lib/sync'

import { useSignOut } from '../hooks/use-sign-out'

async function clearLocalAppCache() {
  const dbs = await indexedDB.databases()
  for (const db of dbs) {
    if (db.name) {
      indexedDB.deleteDatabase(db.name)
    }
  }

  await clearDb()
  for (const key of Object.keys(localStorage)) {
    if (!key.includes('bearer_token')) {
      localStorage.removeItem(key)
    }
  }
}

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

const SOCIAL_ROWS = [
  { label: 'Website', href: 'https://tamery.app', icon: RiGlobalLine },
  { label: 'X', href: SOCIAL_LINKS.TWITTER, icon: RiTwitterXLine },
  { label: 'Discord', href: SOCIAL_LINKS.DISCORD, icon: RiDiscordLine },
  { label: 'GitHub', href: SOCIAL_LINKS.GITHUB, icon: RiGithubLine },
] as const

export function UserButton({
  side = 'right',
  align = 'end',
}: {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
} = {}) {
  const { signOut, isSigningOut } = useSignOut()
  const { data } = authClient.useSession()
  const theme = useTheme()
  const [isSupportOpen, setIsSupportOpen] = useState(false)

  const { mutate: clearLocalCache, isPending: isClearingCache } = useMutation({
    mutationFn: clearLocalAppCache,
    onSuccess: () => {
      toast.success('Local cache cleared. Reloading...')
      window.location.reload()
    },
    onError: err => {
      console.error(err)
      toast.error('Failed to clear cache')
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="size-5 cursor-default rounded-sm">
        <UserAvatar className="size-full" user={data?.user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56" side={side} align={align}>
        <div className="flex flex-col px-2 py-1.5 leading-tight">
          <span className="text-sm font-medium">{data?.user.name}</span>
          <span className="text-xs text-muted-foreground">{data?.user.email}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            window.open(
              `${import.meta.env.VITE_PUBLIC_MAIN_URL}/account`,
              window.electron ? '_blank' : '_self',
            )
          }
        >
          <RiUserLine />
          Account
        </DropdownMenuItem>
        {window.electron && (
          <DropdownMenuItem
            onClick={() => window.open(import.meta.env.VITE_PUBLIC_WEB_URL, '_blank')}
          >
            <RiGlobalLine />
            Web app
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => window.open(RELEASES_URL, '_blank')}>
          <RiHistoryLine />
          Releases
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsSupportOpen(true)}>
          <RiMessageLine />
          Support
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isSigningOut || isClearingCache}
          onClick={() => clearLocalCache()}
        >
          <RiBrushLine />
          Clear cache
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-muted-foreground">Theme</DropdownMenuLabel>
          {THEME_OPTIONS.map(option => (
            <DropdownMenuItem key={option.value} onClick={() => themeStore.set(option.value)}>
              <span aria-hidden className="flex size-4 items-center justify-center">
                {theme === option.value && <span className="size-1.5 rounded-full bg-foreground" />}
              </span>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isSigningOut} onClick={() => signOut()}>
          <RiLogoutCircleRLine />
          Sign out
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-1 px-1 py-0.5">
          {SOCIAL_ROWS.map(social => (
            <Tooltip key={social.label}>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={social.label}
                    className="
                      text-muted-foreground
                      hover:bg-foreground/10 hover:text-foreground
                    "
                    onClick={() => window.open(social.href, '_blank')}
                  />
                }
              >
                <social.icon className="size-3.5" />
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
