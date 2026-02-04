import { cn } from '@conar/ui/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from 'facehash'

export function UserAvatar({
  user,
  className,
}: {
  user?: {
    email: string
    image?: string | null
  }
  className?: string
}) {
  return (
    <Avatar
      className={cn(
        `size-6 shrink-0 overflow-hidden rounded-lg`,
        className,
      )}
    >
      <AvatarImage src={user?.image} />
      <AvatarFallback
        name={user?.email}
        facehashProps={{
          colorClasses: [
            'bg-slate-900',
            'bg-slate-800',
            'bg-sky-500',
            'bg-indigo-500',
            'bg-cyan-500',
            'bg-zinc-800',
          ],
        }}
      />
    </Avatar>
  )
}
