import { UserAvatar as UIUserAvatar } from '@conar/ui/components/custom/user-avatar'
import { authClient } from '~/lib/auth'

export function UserAvatar({ className }: { className?: string }) {
  const { data } = authClient.useSession()
  return (
    <UIUserAvatar
      user={data?.user}
      className={className}
    />
  )
}
