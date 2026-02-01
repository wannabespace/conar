import { Avatar, AvatarFallback, AvatarImage } from '@conar/ui/components/avatar'
import { cn } from '@conar/ui/lib/utils'
import { Facehash } from 'facehash'

const DEFAULT_FACEHASH_COLORS = [
  'bg-slate-900',
  'bg-slate-800',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-zinc-800',
] as const

function getFacehashName(name?: string | null, email?: string | null): string {
  return email ?? name ?? 'user'
}

export interface UserAvatarUser {
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface UserAvatarProps {
  user?: UserAvatarUser | null
  className?: string
  fallbackClassName?: string
  facehashColorClasses?: readonly string[]
}

export function UserAvatar({
  user,
  className,
  fallbackClassName,
  facehashColorClasses = DEFAULT_FACEHASH_COLORS,
}: UserAvatarProps) {
  const name = user?.name ?? null
  const email = user?.email ?? null
  const image = user?.image ?? null
  const hasImage = Boolean(image)
  const facehashName = getFacehashName(name, email)

  return (
    <Avatar
      className={cn(
        `
          size-6 shrink-0 overflow-hidden rounded-full shadow-sm ring-1
          ring-border/60
        `,
        'transition-shadow hover:shadow-md',
        className,
      )}
    >
      {hasImage
        ? (
            <AvatarImage src={image ?? ''} className="rounded-full" />
          )
        : (
            <AvatarFallback
              className={cn(
                'flex items-center justify-center rounded-full bg-transparent',
                fallbackClassName,
              )}
            >
              <Facehash
                name={facehashName}
                size="100%"
                variant="gradient"
                intensity3d="medium"
                interactive
                showInitial={false}
                colorClasses={[...facehashColorClasses]}
                className="size-full rounded-full"
              />
            </AvatarFallback>
          )}
    </Avatar>
  )
}
