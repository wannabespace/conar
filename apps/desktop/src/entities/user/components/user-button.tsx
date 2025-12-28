import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { RiLogoutCircleRLine } from '@remixicon/react'
import { useSignOut } from '../hooks/use-sign-out'
import { UserAvatar } from './user-avatar'

export function UserButton() {
  const { data, signOut, isSigningOut } = useSignOut()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="size-8 cursor-pointer rounded-md">
        <UserAvatar className="size-full" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56" side="right" align="end">
        <div className="mt-1 mb-2 flex h-10 items-center gap-2 px-2">
          <UserAvatar className="size-8" />
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
