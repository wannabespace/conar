import { Blobatar } from '@blobatar/react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@tamery/ui/components/avatar'
import { cn } from '@tamery/ui/lib/utils'

export const UserAvatar = ({
  user,
  className,
}: {
  user:
    | {
        email: string
        image?: string | null
      }
    | null
    | undefined
  className?: string
}) => (
  <Avatar
    className={cn(
      `size-6 shrink-0 overflow-hidden rounded-lg after:rounded-lg`,
      className
    )}
  >
    <AvatarImage src={user?.image ?? undefined} />
    <AvatarFallback className="rounded-lg bg-transparent">
      <Blobatar className="size-full" name={user?.email ?? ''} />
    </AvatarFallback>
  </Avatar>
)
