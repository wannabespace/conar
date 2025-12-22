import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Skeleton } from '@conar/ui/components/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiLogoutCircleRLine, RiVipCrownLine } from '@remixicon/react'
import { UserAvatar, useSignOut } from '~/entities/user'
import { useSubscription } from '~/entities/user/hooks/use-subscription'
import { appStore } from '~/store'
import { SubscriptionModal } from './subscription-modal'

export function Profile({ className }: { className?: string }) {
  const { data, signOut, isSigningOut } = useSignOut()
  const current = useSubscription()

  return (
    <div className={cn('flex flex-row items-center justify-between', className)}>
      <div className="flex flex-row items-center gap-4">
        <UserAvatar className="size-16" fallbackClassName="text-2xl" />
        <div>
          {data?.user
            ? (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-semibold">{data.user.name || 'User'}</h3>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => appStore.setState(state => ({ ...state, subscriptionModalIsOpen: true } satisfies typeof state))}
                    >
                      {current?.plan || 'Hobby'}
                    </Badge>
                  </div>
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
          variant={current ? 'outline' : 'secondary'}
          size="sm"
          onClick={() => appStore.setState(state => ({ ...state, subscriptionModalIsOpen: true } satisfies typeof state))}
        >
          <RiVipCrownLine className="size-4" />
          Subscription
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => signOut()}
                disabled={isSigningOut}
              >
                <LoadingContent loading={isSigningOut}>
                  <RiLogoutCircleRLine />
                </LoadingContent>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Sign out
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <SubscriptionModal />
    </div>
  )
}
