import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import type { ComponentProps, ReactNode } from 'react'

export const EmptyState = ({
  children,
  description,
  icon,
  size,
  title,
}: {
  children?: ReactNode
  description: ReactNode
  icon: IconSvgElement
  size?: ComponentProps<typeof Empty>['size']
  title: string
}) => (
  <Empty size={size}>
    <EmptyHeader>
      <EmptyMedia variant="muted">
        <HugeiconsIcon icon={icon} strokeWidth={2} />
      </EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
    </EmptyHeader>
    {children}
  </Empty>
)
