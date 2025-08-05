import type { OS } from '@conar/shared/utils/os'
import { Button } from '@conar/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Linux } from '@conar/ui/components/icons/linux'
import { RiAppleFill } from '@remixicon/react'
import { useDownloadLinks } from '~/hooks/use-download-link'

const iconsMap: Partial<Record<OS, (props: { className?: string }) => React.ReactNode>> = {
  macos: ({ className }) => <RiAppleFill className={className} />,
  linux: ({ className }) => <Linux className={className} />,
}

export function DownloadButton({ fallback }: { fallback?: React.ReactNode }) {
  const { links, isPending, os } = useDownloadLinks()

  const Icon = (os && iconsMap[os.type]) || null

  if (isPending) {
    return (
      <Button size="lg">
        {Icon && <Icon className="size-4" />}
        <span className="animate-pulse">
          Download for
          {' '}
          {os?.label}
        </span>
      </Button>
    )
  }

  if (!links) {
    return fallback ?? (
      <Button disabled variant="secondary" size="lg">
        No downloads for
        {' '}
        {os?.label}
        {' '}
        :(
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className="flex items-center justify-center gap-2">
          {Icon && <Icon className="size-4" />}
          Download for
          {' '}
          {links.platform}
        </Button>
      </DropdownMenuTrigger>
      {links.assets.length > 1 && (
        <DropdownMenuContent>
          {links.assets.map(asset => (
            <DropdownMenuItem key={asset.url} asChild>
              <a href={asset.url} download className="text-foreground flex gap-2">
                {asset.arch}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
