import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { getRouteApi, Link } from '@tanstack/react-router'

import { posthog } from '~/lib/posthog'

import { DOWNLOAD_PLATFORMS } from './download-files'

const { useLoaderData } = getRouteApi('/_layout')

export const DownloadButton = () => {
  const os = useLoaderData()
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
            onClick={() =>
              posthog.capture('app_downloaded', {
                file: firstFile.label,
                os: platform.os,
              })
            }
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
