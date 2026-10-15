import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import type { ReactNode } from 'react'

export const PaneEmpty = ({
  children,
  description,
  icon: Icon,
  title,
  variant = 'muted',
}: {
  children?: ReactNode
  description: ReactNode
  icon: IconSvgElement
  title: string
  variant?: 'destructive' | 'muted'
}) => (
  <Empty size="sm" className="min-h-0 flex-1 overflow-y-auto">
    <EmptyHeader>
      <EmptyMedia variant={variant}>
        <HugeiconsIcon icon={Icon} strokeWidth={2} />
      </EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription className="max-w-64">{description}</EmptyDescription>
    </EmptyHeader>
    {children}
  </Empty>
)
