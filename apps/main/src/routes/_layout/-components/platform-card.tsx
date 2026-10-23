import { Download04Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { osMap } from '@tamery/shared/os'
import { Badge } from '@tamery/ui/components/badge'
import { cardClass } from '@tamery/ui/components/card.utils'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  smallItemInsetClassName,
} from '@tamery/ui/components/item'
import { cn } from '@tamery/ui/lib/utils'

import type { DownloadPlatform } from '~/components/download-files'
import { posthog } from '~/lib/posthog'
import { pageCardClass } from '~/utils/card'

export const PlatformCard = ({
  isCurrent,
  platform,
}: {
  isCurrent: boolean
  platform: DownloadPlatform
}) => (
  <section className={cn(pageCardClass, 'overflow-hidden')}>
    <header
      className={cn(
        smallItemInsetClassName,
        'border-foreground/6 flex items-center gap-3 border-b py-4'
      )}
    >
      <div
        className={cn(
          cardClass,
          'text-muted-foreground flex size-9 items-center justify-center [&_svg]:size-4.5'
        )}
      >
        {platform.icon}
      </div>
      <h2 className="text-base font-medium">{osMap[platform.os].label}</h2>
      {isCurrent && (
        <Badge variant="secondary" className="ml-auto">
          Your system
        </Badge>
      )}
    </header>
    <div className="flex flex-col">
      {platform.files.map((file) => (
        <Item
          key={file.link}
          variant="grouped"
          size="sm"
          className="cursor-default"
          render={
            <a
              href={file.link}
              download
              aria-label={`Download ${file.label}`}
              onClick={() =>
                posthog.capture('app_downloaded', {
                  file: file.label,
                  os: platform.os,
                })
              }
            />
          }
        >
          <ItemContent>
            <ItemTitle>{file.label}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <HugeiconsIcon
              icon={Download04Icon}
              strokeWidth={2}
              className="text-muted-foreground size-4"
            />
          </ItemActions>
        </Item>
      ))}
    </div>
    {platform.footer}
  </section>
)
