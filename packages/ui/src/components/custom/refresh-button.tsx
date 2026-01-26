import type { ComponentProps } from 'react'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { RiCheckLine, RiLoopLeftLine } from '@remixicon/react'

export function RefreshButton({ refreshing, ...props }: {
  refreshing: boolean
} & Omit<ComponentProps<typeof Button>, 'children'>) {
  return (
    <Button {...props}>
      <LoadingContent loading={refreshing}>
        <ContentSwitch
          activeContent={<RiCheckLine className="text-success" />}
          active={refreshing}
        >
          <RiLoopLeftLine />
        </ContentSwitch>
      </LoadingContent>
    </Button>
  )
}
