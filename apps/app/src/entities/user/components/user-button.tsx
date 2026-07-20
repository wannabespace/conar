import {
  RiBrushLine,
  RiGlobalLine,
  RiHistoryLine,
  RiLogoutCircleRLine,
  RiMessageLine,
  RiUserLine,
} from '@remixicon/react'
import { RELEASES_URL } from '@tamery/shared/constants'
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
import type { Theme } from '@tamery/ui/theme-store'
import { themeStore, useTheme } from '@tamery/ui/theme-store'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { SupportDialog } from '~/components/support-button'
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
      </DropdownMenuContent>
      <SupportDialog open={isSupportOpen} onOpenChange={setIsSupportOpen} />
    </DropdownMenu>
  )
}
