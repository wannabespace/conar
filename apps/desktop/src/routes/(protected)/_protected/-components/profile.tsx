import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { Alert, AlertDescription } from '@conar/ui/components/alert'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Skeleton } from '@conar/ui/components/skeleton'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowUpDoubleLine, RiLogoutCircleRLine, RiSettingsLine } from '@remixicon/react'
import { UserAvatar, useSignOut } from '~/entities/user'
import { useSubscription } from '~/entities/user/hooks/use-subscription'
import { appStore } from '~/store'

export function Profile({ className }: { className?: string }) {
  const { data, signOut, isSigningOut } = useSignOut()
  const { subscription } = useSubscription()

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-row items-center justify-between">
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            disabled={isSigningOut}
          >
            <LoadingContent loading={isSigningOut}>
              <RiLogoutCircleRLine className="size-4" />
              Sign out
            </LoadingContent>
          </Button>
        </div>
      </div>
      <Alert className="px-2 py-1">
        <AlertDescription className="flex items-center justify-between">
          <span>
            You are
            {' '}
            {subscription ? 'already' : 'currently'}
            {' '}
            on the
            {' '}
            <Badge
              variant="secondary"
            >
              {subscription ? uppercaseFirst(subscription.plan) : 'Hobby'}
            </Badge>
            {' '}
            plan.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => appStore.setState(state => ({ ...state, subscriptionModalIsOpen: true } satisfies typeof state))}
          >
            {subscription
              ? <RiSettingsLine className="size-4" />
              : <RiArrowUpDoubleLine className="size-4" />}
            {subscription ? 'Manage' : 'Upgrade'}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
