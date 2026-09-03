import { RefreshIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { ContentSwitch } from '@tamery/ui/components/custom/content-switch'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import type { ComponentProps } from 'react'

export const RefreshButton = ({
  refreshing,
  iconClassName,
  ...props
}: {
  refreshing: boolean
  iconClassName?: string
} & Omit<ComponentProps<typeof Button>, 'children'>) => (
  <Button {...props}>
    <LoadingContent loading={refreshing}>
      <ContentSwitch
        activeContent={
          <HugeiconsIcon
            icon={Tick02Icon}
            strokeWidth={2}
            className="text-success"
          />
        }
        active={refreshing}
      >
        <HugeiconsIcon
          icon={RefreshIcon}
          strokeWidth={2}
          className={iconClassName}
        />
      </ContentSwitch>
    </LoadingContent>
  </Button>
)
