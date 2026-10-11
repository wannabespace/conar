import { Button } from '@tamery/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import type { ComponentProps } from 'react'

import { getOSIsomorphic } from '~/utils/os'

import { DOWNLOAD_PLATFORMS } from './download-files'

const os = getOSIsomorphic()

export const DownloadButton = ({
  className,
  variant,
}: {
  className?: string
  variant?: ComponentProps<typeof Button>['variant']
}) => {
  const platform = DOWNLOAD_PLATFORMS.find(
    (candidate) => candidate.os === os?.type
  )

  if (!os || !platform) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="lg"
              variant={variant}
              className={className}
              disabled
              focusableWhenDisabled
            />
          }
        >
          Download
        </TooltipTrigger>
        <TooltipContent>
          Tamery runs on macOS, Windows and Linux.
        </TooltipContent>
      </Tooltip>
    )
  }

  const [firstFile] = platform.files
  if (platform.files.length === 1 && firstFile) {
    return (
      <Button
        size="lg"
        variant={variant}
        className={className}
        render={
          <a
            href={firstFile.link}
            download
            aria-label={`Download for ${os.label}`}
          />
        }
      >
        {platform.icon}
        Download for {os.label}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button size="lg" variant={variant} className={className} />}
      >
        {platform.icon}
        Download for {os.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {platform.files.map((file) => (
          <DropdownMenuItem
            key={file.link}
            render={
              <a
                href={file.link}
                download
                aria-label={`Download ${file.label}`}
                className="text-foreground"
              />
            }
          >
            {file.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
