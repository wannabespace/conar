import { Download04Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { osMap } from '@tamery/shared/os'
import { Badge } from '@tamery/ui/components/badge'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  smallItemInsetClassName,
} from '@tamery/ui/components/item'
import { cn } from '@tamery/ui/lib/utils'

import type { DownloadPlatform } from '~/components/download-files'
import { getOSIsomorphic } from '~/utils/os'

import { HomebrewInstall } from './homebrew-install'

const os = getOSIsomorphic()

export const PlatformCard = ({ platform }: { platform: DownloadPlatform }) => (
  <section className="bg-background ring-foreground/4 overflow-hidden rounded-2xl shadow-xs ring">
    <header
      className={cn(
        smallItemInsetClassName,
        'border-foreground/6 flex items-center gap-3 border-b py-4'
      )}
    >
      <div className="bg-popover ring-foreground/4 text-muted-foreground flex size-9 items-center justify-center rounded-xl shadow-xs ring [&_svg]:size-4.5">
        {platform.icon}
      </div>
      <h2 className="text-base font-medium">{osMap[platform.os].label}</h2>
      {platform.os === os?.type && (
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
          className="text-foreground cursor-default"
          render={
            <a
              href={file.link}
              download
              aria-label={`Download ${file.label}`}
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
    {platform.os === 'macos' && <HomebrewInstall />}
  </section>
)
