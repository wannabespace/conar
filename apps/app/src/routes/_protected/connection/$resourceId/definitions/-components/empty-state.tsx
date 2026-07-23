import { RiInformationLine } from '@remixicon/react'
import { CardContent } from '@tamery/ui/components/card'
import { CardMotion } from '@tamery/ui/components/card.motion'

import { MOTION_BLOCK_PROPS } from '../-constants'

export function DefinitionsEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <CardMotion layout {...MOTION_BLOCK_PROPS}>
      <CardContent
        className="
        flex flex-col items-center justify-center p-10 text-center
      "
      >
        <div
          className="
            mb-4 flex size-12 items-center justify-center rounded-2xl
            bg-muted/60
          "
        >
          <RiInformationLine className="size-6 text-muted-foreground/70" />
        </div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </CardMotion>
  )
}
