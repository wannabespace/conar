import { RiInformationLine } from '@remixicon/react'
import { CardContent } from '@tamery/ui/components/card'
import { CardMotion } from '@tamery/ui/components/card.motion'
import { MOTION_BLOCK_PROPS } from '../-constants'

export function DefinitionsEmptyState({ title, description }: {
  title: string
  description: string
}) {
  return (
    <CardMotion layout {...MOTION_BLOCK_PROPS}>
      <CardContent className="
        flex flex-col items-center justify-center p-10 text-center
      "
      >
        <RiInformationLine className="
          mx-auto mb-3 size-12 text-muted-foreground
        "
        />
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </CardMotion>
  )
}
