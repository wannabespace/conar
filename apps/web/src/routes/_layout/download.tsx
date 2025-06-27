import type { OS } from '@conar/shared/utils/os'
import type { RemixiconComponentType } from '@remixicon/react'
import { formatBytes } from '@conar/shared/utils/files'
import { getOS } from '@conar/shared/utils/os'
import { Badge } from '@conar/ui/components/badge'
import { AppLogoSquare } from '@conar/ui/components/brand/app-logo-square'
import { Button } from '@conar/ui/components/button'
import { Card } from '@conar/ui/components/card'
import { MountedSuspense } from '@conar/ui/components/custom/mounted-suspense'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow, { NumberFlowGroup } from '@number-flow/react'
import { RiAppleFill, RiArrowDownSLine } from '@remixicon/react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { LinuxLogo } from '~/assets/linux-logo'
import { getLatestReleaseQuery } from '~/lib/queries'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/_layout/download')({
  component: RouteComponent,
  head: () => ({
    meta: seo({
      title: 'Download Conar',
    }),
  }),
})

function Version() {
  const { data, isPending } = useQuery(getLatestReleaseQuery)
  const versionNumbers = data ? data.version.slice(1).split('.').map(Number) : [0, 0, 0]

  return (
    <p className="text-sm text-muted-foreground">
      Current release:
      {' '}
      <span className={cn('font-medium', isPending && 'text-muted-foreground/50 animate-pulse')}>
        <NumberFlowGroup>
          {versionNumbers.map((number, index) => (
            <NumberFlow
              key={index}
              value={number}
              prefix={index === 0 ? 'v' : ''}
              suffix={index === versionNumbers.length - 1 ? '' : '.'}
            />
          ))}
        </NumberFlowGroup>
      </span>
    </p>
  )
}

function DownloadLink() {
  const os = getOS()
  const { data: { mac, linux } } = useSuspenseQuery(getLatestReleaseQuery)

  const downloadLinks = useMemo((): { platform: string, assets: { arch: string, url: string }[] } | null => {
    if (os === 'macos' && mac.intel && mac.arm64) {
      return {
        platform: 'macOS',
        assets: [
          {
            arch: 'Apple Silicon',
            url: mac.arm64.url,
          },
          {
            arch: 'Intel',
            url: mac.intel.url,
          },
        ],
      }
    }

    if (os === 'linux' && linux.deb && linux.appimage) {
      return {
        platform: 'Linux',
        assets: [
          {
            arch: 'deb',
            url: linux.deb.url,
          },
          {
            arch: 'AppImage',
            url: linux.appimage.url,
          },
        ],
      }
    }

    // if (os === 'windows' && windows.exe) {
    //   return {
    //     platform: 'Windows',
    //     assets: [
    //       {
    //         arch: 'exe',
    //         url: windows.exe.url,
    //       },
    //     ],
    //   }
    // }

    return null
  }, [os, mac, linux])

  if (!downloadLinks) {
    return (
      <Button disabled variant="secondary" size="lg">
        No downloads found for this platform :(
      </Button>
    )
  }

  if (downloadLinks.assets.length === 1) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          key={downloadLinks.assets[0].url}
          asChild
          size="lg"
        >
          <a href={downloadLinks.assets[0].url} download className="flex items-center justify-center gap-2">
            Download for
            {' '}
            {downloadLinks.platform}
          </a>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className="flex items-center justify-center gap-2">
          Download for
          {' '}
          {downloadLinks.platform}
          <RiArrowDownSLine />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {downloadLinks.assets.map(asset => (
          <DropdownMenuItem key={asset.url} asChild>
            <a href={asset.url} download className="text-foreground flex gap-2">
              {downloadLinks.platform}
              {' '}
              {asset.arch}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AllPlatforms() {
  const { data: { mac, linux } } = useSuspenseQuery(getLatestReleaseQuery)

  return (
    <>
      <DownloadOption
        Icon={RiAppleFill}
        platform="macOS"
        arch="Apple Silicon"
        asset={mac.arm64}
      />
      <DownloadOption
        Icon={RiAppleFill}
        platform="macOS"
        arch="Intel"
        asset={mac.intel}
      />
      <DownloadOption
        Icon={LinuxLogo}
        platform="Linux"
        arch="deb"
        asset={linux.deb}
      />
      <DownloadOption
        Icon={LinuxLogo}
        platform="Linux"
        arch="AppImage"
        asset={linux.appimage}
      />
    </>
  )
}

function DownloadOption({ Icon, platform, arch, asset }: {
  Icon: RemixiconComponentType
  platform: string
  arch?: string
  asset?: {
    name: string
    url: string
    type: OS
    size: number
  }
}) {
  return (
    <Card className="flex items-center justify-between p-2 gap-8 w-full">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center size-8 bg-muted rounded-lg">
          <Icon className="text-muted-foreground size-4" />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium">
            {platform}
            {' '}
            {arch && (
              <Badge variant="outline">
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
            disabled={!asset}
            variant="secondary"
          >
            <a
              href={asset ? asset.url : '#'}
              download
              className="flex items-center justify-center gap-1.5"
            >
              Download
            </a>
          </Button>
        </TooltipTrigger>
        {asset && (
          <TooltipContent side="right">
            {formatBytes(asset.size)}
          </TooltipContent>
        )}
      </Tooltip>
    </Card>
  )
}

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-40">
      <div className="flex flex-col items-center max-w-2xl mx-auto text-center">
        <AppLogoSquare className="size-32 mb-6" />
        <h1 className="text-4xl mb-3 tracking-tight font-medium">
          Download
          {' '}
          <strong>Conar</strong>
        </h1>
        <p className="text-lg text-muted-foreground">
          Available for macOS and Linux
        </p>
        <p className="text-muted-foreground opacity-50 mb-10 text-xs">
          Windows users will have to wait a bit longer :(
        </p>
        <div className="mb-12 text-center space-y-2">
          <MountedSuspense fallback={<div className="h-10 w-44 bg-muted animate-pulse rounded-md" />}>
            <DownloadLink />
          </MountedSuspense>
          <Version />
        </div>
        <div className="max-w-xl w-full">
          <h2 className="text-2xl font-semibold text-center mb-4">All platforms</h2>
          <div className="space-y-2 w-full">
            <MountedSuspense fallback={(
              <>
                <DownloadOption
                  Icon={RiAppleFill}
                  platform="macOS"
                  arch="Apple Silicon"
                />
                <DownloadOption
                  Icon={RiAppleFill}
                  platform="macOS"
                  arch="Intel"
                />
                <DownloadOption
                  Icon={LinuxLogo}
                  platform="Linux"
                  arch="deb"
                />
                <DownloadOption
                  Icon={LinuxLogo}
                  platform="Linux"
                  arch="AppImage"
                />
              </>
            )}
            >
              <AllPlatforms />
            </MountedSuspense>
          </div>
        </div>
      </div>
    </div>
  )
}
