import { ArrowTurnBackwardIcon, SaveIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

import { cardClass } from '~/components/card'
import { PaneEmpty } from '~/components/pane-empty'

/** `title` is not masked here; the caller masks its user values. */
export const ChangeGroup = ({
  action,
  children,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  title: ReactNode
}) => (
  <div className={cn(cardClass, 'overflow-hidden')}>
    <header className="border-foreground/6 flex h-9 items-center gap-2 border-b pr-1.5 pl-3">
      <span className="text-2xs text-foreground min-w-0 flex-1 truncate">
        {title}
      </span>
      {action}
    </header>
    {children}
  </div>
)

export const StagedReviewDrawer = ({
  busy,
  children,
  contentProps,
  count,
  description,
  emptyDescription,
  notice,
  onDiscardAll,
  onOpenChange,
  onSubmit,
  open,
  submit,
}: {
  busy: boolean
  children: ReactNode
  contentProps?: Pick<
    ComponentProps<typeof DrawerContent>,
    'className' | 'finalFocus' | 'initialFocus'
  >
  count: number
  description: ReactNode
  emptyDescription: string
  notice?: ReactNode
  onDiscardAll: () => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
  open: boolean
  submit: {
    label: string
    tooltip: ReactNode
    variant?: ComponentProps<typeof Button>['variant']
  }
}) => (
  <Drawer
    open={open}
    onOpenChange={onOpenChange}
    swipeDirection="right"
    size="sm"
  >
    <DrawerContent {...contentProps}>
      <DrawerHeader>
        <DrawerTitle>Review changes</DrawerTitle>
        <DrawerDescription>{description}</DrawerDescription>
      </DrawerHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3">
        {count === 0 ? (
          <PaneEmpty
            icon={SaveIcon}
            title="Nothing to review"
            description={emptyDescription}
          />
        ) : (
          children
        )}
      </div>
      {notice}
      <DrawerFooter>
        <Button
          variant="ghost-muted"
          onClick={onDiscardAll}
          disabled={busy || count === 0}
          className="mr-auto"
        >
          <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} />
          Discard all
        </Button>
        <DrawerClose render={<Button variant="outline">Close</Button>} />
        <Tooltip
          shortcut={
            !busy &&
            count > 0 && (
              <KbdCtrlLetter userAgent={navigator.userAgent} letter="S" />
            )
          }
        >
          <TooltipTrigger
            render={
              <Button
                variant={submit.variant}
                onClick={onSubmit}
                disabled={busy || count === 0}
              />
            }
          >
            <LoadingContent loading={busy}>{submit.label}</LoadingContent>
          </TooltipTrigger>
          <TooltipContent>{submit.tooltip}</TooltipContent>
        </Tooltip>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
)
