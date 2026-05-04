import { UserAvatar } from '@conar/ui/components/custom/user-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { RiLogoutCircleRLine } from '@remixicon/react'
import { authClient } from '~/lib/auth'
import { useSignOut } from '../hooks/use-sign-out'

export function UserButton() {
  const { signOut, isSigningOut } = useSignOut()
  const { data } = authClient.useSession()

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
