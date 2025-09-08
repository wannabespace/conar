import { Avatar, AvatarFallback, AvatarImage } from '@conar/ui/components/avatar'
import { cn } from '@conar/ui/lib/utils'
import { useMemo } from 'react'
import { authClient } from '~/lib/auth'

function getFallback(name: string | undefined, email: string | undefined) {
  if (name) {
    const nameParts = name.split(' ')

    if (nameParts.length > 1) {
      return `${nameParts[0]!.charAt(0)}${nameParts[1]!.charAt(0)}`
    }

    return name.charAt(0)
  }

  return email?.slice(0, 2)
}

export function UserAvatar({ className, fallbackClassName }: { className?: string, fallbackClassName?: string }) {
  const { data } = authClient.useSession()

  const fallback = useMemo(() => getFallback(data?.user.name, data?.user.email), [data?.user.name, data?.user.email])

  return (
    <Avatar className={cn('size-6', className)}>
      {data?.user.image && <AvatarImage src={data?.user.image} />}
      <AvatarFallback className={cn('uppercase text-xs', fallbackClassName)}>{fallback}</AvatarFallback>
    </Avatar>
  )
}
