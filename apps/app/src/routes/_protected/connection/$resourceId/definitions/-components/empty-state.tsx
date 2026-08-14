import { RiInformationLine } from '@remixicon/react'
import { CardContent } from '@tamery/ui/components/card'
import { CardMotion } from '@tamery/ui/components/card.motion'

import { MOTION_BLOCK_PROPS } from '../-constants'

export const DefinitionsEmptyState = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <CardMotion layout {...MOTION_BLOCK_PROPS}>
    <CardContent className="flex flex-col items-center justify-center p-10 text-center">
      <div className="bg-muted/60 mb-4 flex size-12 items-center justify-center rounded-2xl">
        <RiInformationLine className="text-muted-foreground/70 size-6" />
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-md text-xs">
        {description}
      </p>
    </CardContent>
  </CardMotion>
)
