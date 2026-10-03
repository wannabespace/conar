import { CrownIcon, SproutIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { pseudoRandom } from '@tamery/shared/utils'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { DrawerClose, DrawerFooter } from '@tamery/ui/components/drawer'
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@tamery/ui/components/number-field'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import type { CSSProperties } from 'react'
import { useSubscription } from 'seitu/react'

import { SidebarButton } from '~/components/sidebar-link'
import type { Column } from '~/core/table/cell/utils'
import { checkOrUpgrade } from '~/core/user/permissions'
import { useIsAnonymous } from '~/lib/auth'

import { useTablePageStore } from '../../../lib/store'
import { FREE_SEED_LIMIT, useSeedQuota } from '../../../seeds/usage'

const GENERATOR_ROWS = 8
const MAX_SEED_ROWS = 10_000

export const SeedFooter = ({
  canSeed,
  seeding = false,
  onSeed,
}: {
  canSeed: boolean
  seeding?: boolean
  onSeed?: () => void
}) => {
  const store = useTablePageStore()
  const seedsCount = useSubscription(store, {
    selector: (state) => state.seedsCount,
  })
  const { hasReachedLimit, remaining, unlimited } = useSeedQuota()
  const isGuest = useIsAnonymous()

  return (
    <DrawerFooter>
      <NumberField
        min={1}
        max={MAX_SEED_ROWS}
        value={seedsCount}
        onValueChange={(value) =>
          store.set(
            (state) =>
              ({
                ...state,
                seedsCount: Math.max(1, Math.min(MAX_SEED_ROWS, value ?? 1)),
              }) satisfies typeof state
          )
        }
        className="w-28"
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      <div className="mr-auto">
        {!unlimited && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost-muted"
                  size="xs"
                  className={isGuest ? 'opacity-50' : undefined}
                  onClick={() => checkOrUpgrade('seed.unlimited')}
                />
              }
            >
              <HugeiconsIcon icon={CrownIcon} strokeWidth={2} />
              {remaining} of {FREE_SEED_LIMIT} free runs left
            </TooltipTrigger>
            <TooltipContent>Upgrade for unlimited seeding</TooltipContent>
          </Tooltip>
        )}
      </div>
      <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
      <Button
        onClick={() =>
          hasReachedLimit ? checkOrUpgrade('seed.unlimited') : onSeed?.()
        }
        disabled={seeding || (!canSeed && !hasReachedLimit)}
        className={isGuest && hasReachedLimit ? 'opacity-50' : undefined}
      >
        <LoadingContent loading={seeding}>
          <HugeiconsIcon
            icon={hasReachedLimit ? CrownIcon : SproutIcon}
            strokeWidth={2}
          />
          {hasReachedLimit ? (
            'Upgrade to seed'
          ) : (
            <NumberFlow
              value={seedsCount}
              className="tabular-nums"
              prefix="Seed "
              suffix={seedsCount === 1 ? ' row' : ' rows'}
            />
          )}
        </LoadingContent>
      </Button>
    </DrawerFooter>
  )
}

export const SeedPanelSkeleton = ({ columns }: { columns: Column[] }) => (
  <>
    <div className="flex min-h-0 flex-1">
      <div className="no-scrollbar flex w-72 shrink-0 flex-col gap-px overflow-hidden border-r p-2">
        {columns.map((column, index) => (
          <SidebarButton key={column.id} disabled active={index === 0}>
            <span data-mask className="min-w-0 flex-1 truncate text-left">
              {column.id}
            </span>
          </SidebarButton>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-9 shrink-0 items-center justify-between border-b px-3">
          <Skeleton className="h-2.5 w-24 rounded-full" />
          <Skeleton className="h-2.5 w-14 rounded-full" />
        </div>
        <div className="flex h-9 shrink-0 items-center border-b px-3">
          <Skeleton className="h-2.5 w-28 rounded-full" />
        </div>
        <div className="flex flex-col gap-px p-1">
          {Array.from({ length: GENERATOR_ROWS }, (_, index) => (
            <div
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              className="flex h-7 items-center px-2"
            >
              <Skeleton
                className="h-2.5 w-(--bar-width) rounded-full"
                style={
                  {
                    '--bar-width': `${30 + pseudoRandom(index) * 40}%`,
                  } as CSSProperties
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
    <SeedFooter canSeed={false} />
  </>
)
