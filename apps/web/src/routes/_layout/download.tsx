import type { OS } from '@conar/shared/utils/os'
import type { RemixiconComponentType } from '@remixicon/react'
import { BREW_INSTALL_COMMAND } from '@conar/shared/constants'
import { osMap } from '@conar/shared/utils/os'
import { Badge } from '@conar/ui/components/badge'
import { AppLogoSquare } from '@conar/ui/components/brand/app-logo-square'
import { Button } from '@conar/ui/components/button'
import { Card } from '@conar/ui/components/card'
import { CopyButton } from '@conar/ui/components/custom/copy-button'
import { Linux } from '@conar/ui/components/icons/linux'
import { Tooltip, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiAppleFill, RiTerminalLine, RiWindowsFill } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
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
  if (os?.type !== 'macos') {
    return null
  }

  return (
    <div className={`
      mb-8 w-full max-w-xl px-4
      sm:mb-12
    `}
    >
      <h2 className={`
        mb-4 text-center text-xl font-semibold
        sm:text-2xl
      `}
      >
        Install via Homebrew
      </h2>
      <Card className={`
        flex flex-row w-full items-center justify-between gap-4 p-3
        sm:gap-8 sm:p-2
      `}
      >
        <div className={`
          flex min-w-0 flex-1 items-center gap-3
          sm:gap-4
        `}
        >
          <div className={`
            flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted
          `}
          >
            <RiTerminalLine className="size-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            className={`
              m-0 block flex-1 border-none bg-transparent p-0 pr-10 font-mono
              text-sm outline-none
              sm:text-base
            `}
            value={BREW_INSTALL_COMMAND}
            readOnly
          />
        </div>
        <CopyButton text={BREW_INSTALL_COMMAND} />
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
      <DownloadOption
        Icon={Linux}
        type="linux"
        arch="deb"
        link={DOWNLOAD_LINKS.linux.deb}
      />
      <DownloadOption
        Icon={Linux}
        type="linux"
        arch="AppImage"
        link={DOWNLOAD_LINKS.linux.appImage}
      />
      <DownloadOption
        Icon={Linux}
        type="linux"
        arch="rpm"
        link={DOWNLOAD_LINKS.linux.rpm}
      />
    </>
  )
}

function DownloadOption({ Icon, type, arch, link }: {
  Icon: RemixiconComponentType
  type: OS
  arch?: string
  link: string
}) {
  return (
    <Card className={`
      flex flex-row w-full items-center justify-between gap-4 p-3
      sm:gap-8 sm:p-2
    `}
    >
      <div className={`
        flex min-w-0 flex-1 items-center gap-3
        sm:gap-4
      `}
      >
        <div className={`
          flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted
        `}
        >
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-start">
          <span className={`
            w-full truncate text-sm font-medium
            sm:text-base
          `}
          >
            {osMap[type].label}
            {' '}
            {arch && (
              <Badge
                variant="outline"
                className={`
                  text-xs
                  sm:text-sm
                `}
              >
                {arch}
              </Badge>
            )}
          </span>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            size="sm"
            disabled={!link}
            variant="secondary"
          >
            <a
              href={link}
              download
            >
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
    <div className={`
      flex flex-col items-center justify-center px-4 py-8
      sm:px-6 sm:py-[10vh]
    `}
    >
      <div className={`
        mx-auto flex w-full max-w-2xl flex-col items-center text-center
      `}
      >
        <AppLogoSquare className={`
          mb-4 size-24
          sm:mb-6 sm:size-32
        `}
        />
        <h1 className={`
          mb-2 px-2 text-2xl font-medium tracking-tight
          sm:mb-3 sm:text-3xl
          md:text-4xl
        `}
        >
          Download
          {' '}
          <strong>Conar</strong>
        </h1>
        <p className={`
          mb-6 px-2 text-base text-muted-foreground
          sm:mb-10 sm:text-lg
        `}
        >
          Available for macOS, Windows and Linux
        </p>
        <div className={`
          mb-8 space-y-2 px-4 text-center
          sm:mb-12
        `}
        >
          <DownloadButton />
        </div>
        <HomebrewInstall />
        <div className="w-full max-w-xl px-4">
          <h2 className={`
            mb-4 text-center text-xl font-semibold
            sm:text-2xl
          `}
          >
            All platforms
          </h2>
          <div className="w-full space-y-2">
            <AllPlatforms />
          </div>
        </div>
      </div>
    </div>
  )
}
