import { UserAvatar as UIUserAvatar } from '@conar/ui/components/user-avatar'
import { authClient } from '~/lib/auth'

interface UserAvatarProps {
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({ className, fallbackClassName }: UserAvatarProps) {
  const { data } = authClient.useSession()
  return (
    <UIUserAvatar
      user={data?.user}
      className={className}
      fallbackClassName={fallbackClassName}
    />
  )
}
