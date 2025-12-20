import type { OS } from '@conar/shared/utils/os'
import type { RemixiconComponentType } from '@remixicon/react'
import { BREW_INSTALL_COMMAND } from '@conar/shared/constants'
import { osMap } from '@conar/shared/utils/os'
import { Badge } from '@conar/ui/components/badge'
import { AppLogoSquare } from '@conar/ui/components/brand/app-logo-square'
import { Button } from '@conar/ui/components/button'
import { Card } from '@conar/ui/components/card'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { Linux } from '@conar/ui/components/icons/linux'
import { Tooltip, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import {
  RiAppleFill,
  RiCheckLine,
  RiFileCopyLine,
  RiTerminalLine,
  RiWindowsFill,
} from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { DownloadButton } from '~/components/download-button'
import { DOWNLOAD_LINKS } from '~/constants'
import { getOSIsomorphic } from '~/utils/os'
import { seo } from '~/utils/seo'

const os = getOSIsomorphic()

export const Route = createFileRoute('/_layout/download')({
  component: RouteComponent,
  head: () => ({
    meta: seo({
      title: 'Download Conar',
    }),
  }),
})

function HomebrewInstall() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copy(BREW_INSTALL_COMMAND, 'Command copied to clipboard')
    setCopied(true)
  }

  if (os?.type !== 'macos') {
    return null
  }

  return (
    <div className="w-full max-w-xl px-4 mb-8 sm:mb-12">
      <h2 className="text-xl sm:text-2xl font-semibold text-center mb-4">Install via Homebrew</h2>
      <Card className="flex items-center justify-between p-3 sm:p-2 gap-4 sm:gap-8 w-full">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center justify-center size-8 bg-muted rounded-lg shrink-0">
            <RiTerminalLine className="text-muted-foreground size-4" />
          </div>
          <input
            type="text"
            className="text-sm sm:text-base font-mono bg-transparent border-none p-0 pr-10 m-0 outline-none flex-1 block"
            value={BREW_INSTALL_COMMAND}
            readOnly
          />
        </div>
        <Button size="sm" variant="ghost" onClick={handleCopy} className="shrink-0">
          <span className="flex items-center gap-1.5">
            <ContentSwitch
              active={copied}
              onSwitchEnd={() => setCopied(false)}
              activeContent={<RiCheckLine className="size-4 text-success" />}
            >
              <RiFileCopyLine className="size-4" />
            </ContentSwitch>
            <span className="hidden sm:inline">Copy</span>
          </span>
        </Button>
      </Card>
    </div>
  )
}

function AllPlatforms() {
  return (
    <>
      <DownloadOption
        Icon={RiAppleFill}
        type="macos"
        arch="Apple Silicon"
        link={DOWNLOAD_LINKS.macos.arm64}
      />
      <DownloadOption
        Icon={RiAppleFill}
        type="macos"
        arch="Intel"
        link={DOWNLOAD_LINKS.macos.intel}
      />
      <DownloadOption
        Icon={RiWindowsFill}
        type="windows"
        arch="exe"
        link={DOWNLOAD_LINKS.windows.exe}
      />
      <DownloadOption Icon={Linux} type="linux" arch="deb" link={DOWNLOAD_LINKS.linux.deb} />
      <DownloadOption
        Icon={Linux}
        type="linux"
        arch="AppImage"
        link={DOWNLOAD_LINKS.linux.appImage}
      />
      <DownloadOption Icon={Linux} type="linux" arch="rpm" link={DOWNLOAD_LINKS.linux.rpm} />
    </>
  )
}

function DownloadOption({
  Icon,
  type,
  arch,
  link,
}: {
  Icon: RemixiconComponentType
  type: OS
  arch?: string
  link: string
}) {
  return (
    <Card className="flex items-center justify-between p-3 sm:p-2 gap-4 sm:gap-8 w-full">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div className="flex items-center justify-center size-8 bg-muted rounded-lg shrink-0">
          <Icon className="text-muted-foreground size-4" />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium text-sm sm:text-base truncate w-full">
            {osMap[type].label}{' '}
            {arch && (
              <Badge variant="outline" className="text-xs sm:text-sm">
                {arch}
              </Badge>
            )}
          </span>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild size="sm" disabled={!link} variant="secondary">
            <a href={link} download>
              Download
            </a>
          </Button>
        </TooltipTrigger>
      </Tooltip>
    </Card>
  )
}

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-[10vh]">
      <div className="flex flex-col items-center max-w-2xl mx-auto text-center w-full">
        <AppLogoSquare className="size-24 sm:size-32 mb-4 sm:mb-6" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 tracking-tight font-medium px-2">
          Download <strong>Conar</strong>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-10 px-2">
          Available for macOS, Windows and Linux
        </p>
        <div className="mb-8 sm:mb-12 text-center space-y-2 px-4">
          <DownloadButton />
        </div>
        <HomebrewInstall />
        <div className="w-full max-w-xl px-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-4">All platforms</h2>
          <div className="space-y-2 w-full">
            <AllPlatforms />
          </div>
        </div>
      </div>
    </div>
  )
}
