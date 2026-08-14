import { RiCheckLine, RiLoopLeftLine } from '@remixicon/react'
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
        activeContent={<RiCheckLine className="text-success" />}
        active={refreshing}
      >
        <RiLoopLeftLine className={iconClassName} />
      </ContentSwitch>
    </LoadingContent>
  </Button>
)
