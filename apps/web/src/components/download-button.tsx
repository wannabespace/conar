import type { OS } from '@conar/shared/utils/os'
import { Button } from '@conar/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@conar/ui/components/dropdown-menu'
import { Linux } from '@conar/ui/components/icons/linux'
import { RiAppleFill, RiWindowsFill } from '@remixicon/react'
import { DOWNLOAD_LINKS } from '~/constants'
import { getOSIsomorphic } from '~/utils/os'

const os = getOSIsomorphic()

const iconsMap: Partial<Record<OS, (props: { className?: string }) => React.ReactNode>> = {
  macos: ({ className }) => <RiAppleFill className={className} />,
  linux: ({ className }) => <Linux className={className} />,
  windows: ({ className }) => <RiWindowsFill className={className} />,
}

export function DownloadButton() {
  if (!os) {
    return (
      <Button disabled variant="secondary" size="lg">
        No downloads for your operating system :(
      </Button>
    )
  }

  const links = DOWNLOAD_LINKS[os.type as keyof typeof DOWNLOAD_LINKS]

  const Icon = iconsMap[os.type] || null

  const assets = Object.entries(links).map(([arch, link]) => ({
    arch,
    link,
  }))

  if (assets.length === 1) {
    return (
      <Button size="lg" className="flex items-center justify-center gap-2">
        <a href={assets[0]!.link} download>
          {Icon && <Icon className="size-4" />}
          Download for {os.label}
        </a>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className="flex items-center justify-center gap-2">
          {Icon && <Icon className="size-4" />}
          Download for {os.label}
        </Button>
      </DropdownMenuTrigger>
      {assets.length > 1 && (
        <DropdownMenuContent>
          {assets.map((asset) => (
            <DropdownMenuItem key={asset.link} asChild>
              <a href={asset.link} download className="text-foreground flex gap-2">
                {asset.arch}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
