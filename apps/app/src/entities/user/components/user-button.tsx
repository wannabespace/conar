import { RiBrushLine, RiGlobalLine, RiLogoutCircleRLine, RiUserLine } from '@remixicon/react'
import { UserAvatar } from '@tamery/ui/components/custom/user-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@tamery/ui/components/dropdown-menu'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
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

export function UserButton() {
  const { signOut, isSigningOut } = useSignOut()
  const { data } = authClient.useSession()

  const { mutate: clearLocalCache, isPending: isClearingCache } = useMutation({
    mutationFn: clearLocalAppCache,
    onSuccess: () => {
      toast.success('Local cache cleared. Reloading...')
      window.location.reload()
    },
    onError: (err) => {
      console.error(err)
      toast.error('Failed to clear cache')
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="size-8 cursor-pointer rounded-md">
        <UserAvatar className="size-full" user={data?.user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56" side="right" align="end">
        <div className="mt-1 mb-2 flex h-10 items-center gap-2 px-2">
          <UserAvatar className="size-8" user={data?.user} />
          <div className="flex flex-col leading-0">
            <span className="text-sm font-medium">
              {data?.user.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {data?.user.email}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => window.open(`${import.meta.env.VITE_PUBLIC_MAIN_URL}/account`, window.electron ? '_blank' : '_self')}
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
        <DropdownMenuItem
          disabled={isSigningOut || isClearingCache}
          onClick={() => clearLocalCache()}
        >
          <RiBrushLine />
          Clear cache
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onClick={() => signOut()}
        >
          <RiLogoutCircleRLine />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
