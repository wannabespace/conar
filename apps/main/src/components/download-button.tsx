import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { Link } from '@tanstack/react-router'

import { getOSIsomorphic } from '~/utils/os'

import { DOWNLOAD_PLATFORMS } from './download-files'

const os = getOSIsomorphic()

export const DownloadButton = () => {
  const platform = DOWNLOAD_PLATFORMS.find(
    (candidate) => candidate.os === os?.type
  )

  if (!os || !platform) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<Button size="lg" disabled focusableWhenDisabled />}
        >
          Download
        </TooltipTrigger>
        <TooltipContent>
          Tamery runs on macOS, Windows and Linux.
        </TooltipContent>
      </Tooltip>
    )
  }

  const [firstFile, ...otherFiles] = platform.files

  return (
    <Button
      size="lg"
      render={
        firstFile && otherFiles.length === 0 ? (
          <a
            href={firstFile.link}
            download
            aria-label={`Download for ${os.label}`}
          />
        ) : (
          <Link to="/download" />
        )
      }
    >
      {platform.icon}
      Download for {os.label}
    </Button>
  )
}
