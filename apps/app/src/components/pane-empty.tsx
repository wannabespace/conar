import type { RemixiconComponentType } from '@remixicon/react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'

export const PaneEmpty = ({
  description,
  icon: Icon,
  title,
}: {
  description: string
  icon: RemixiconComponentType
  title: string
}) => (
  <Empty className="min-h-0 flex-1 p-4 md:p-4">
    <EmptyHeader className="gap-1">
      <EmptyMedia
        variant="icon"
        className="bg-muted/60 text-muted-foreground/70 mb-3 size-14 rounded-2xl [&_svg]:size-7"
      >
        <Icon />
      </EmptyMedia>
      <EmptyTitle className="text-sm font-medium tracking-normal">
        {title}
      </EmptyTitle>
      <EmptyDescription className="max-w-64 text-xs">
        {description}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)
