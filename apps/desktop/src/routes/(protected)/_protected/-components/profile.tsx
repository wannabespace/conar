import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Skeleton } from '@conar/ui/components/skeleton'
import { cn } from '@conar/ui/lib/utils'
import { RiLogoutBoxLine } from '@remixicon/react'
import { UserAvatar } from '~/entities/user/components'
import { useSignOut } from '~/entities/user/hooks'

export function Profile({ className }: { className?: string }) {
  const { data, signOut, isSigningOut } = useSignOut()

  return (
    <div className={cn('flex flex-row items-center justify-between', className)}>
      <div className="flex flex-row items-center gap-4">
        <UserAvatar className="size-16" fallbackClassName="text-2xl" />
        <div>
          {data?.user
            ? (
                <>
                  <h3 className="text-2xl font-semibold">{data.user.name || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">{data.user.email}</p>
                </>
              )
            : (
                <>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-50 bg-accent/70" />
                    <Skeleton className="h-4 w-32 bg-accent/70" />
                  </div>
                </>
              )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut()}
        disabled={isSigningOut}
      >
        <LoadingContent loading={isSigningOut}>
          <RiLogoutBoxLine />
          Sign out
        </LoadingContent>
      </Button>
    </div>
  )
}
