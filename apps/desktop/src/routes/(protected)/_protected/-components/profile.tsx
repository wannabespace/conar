import { ACCOUNT_LINK } from '@conar/shared/constants'
import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Skeleton } from '@conar/ui/components/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiExternalLinkLine, RiLogoutCircleRLine, RiUserLine } from '@remixicon/react'
import { UserAvatar, useSignOut } from '~/entities/user'
import { useSubscription } from '~/entities/user/hooks/use-subscription'

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
                  <div>
                    <h3 className={`
                      flex items-center gap-2 text-2xl font-semibold
                    `}
                    >
                      {data.user.name}
                      <Badge variant="secondary">
                        {subscription ? uppercaseFirst(subscription.plan) : 'Hobby'}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">{data.user.email}</p>
                  </div>
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
            asChild
          >
            <a href={ACCOUNT_LINK} target="_blank">
              Account
              <RiExternalLinkLine className="size-3.5 text-muted-foreground" />
            </a>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => signOut()}
                disabled={isSigningOut}
              >
                <LoadingContent loading={isSigningOut}>
                  <RiLogoutCircleRLine className="size-4" />
                </LoadingContent>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Sign out
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
