import type { OS } from '@conar/shared/utils/os'
import type { RemixiconComponentType } from '@remixicon/react'
import { formatBytes } from '@conar/shared/utils/files'
import { osMap } from '@conar/shared/utils/os'
import { Badge } from '@conar/ui/components/badge'
import { AppLogoSquare } from '@conar/ui/components/brand/app-logo-square'
import { Button } from '@conar/ui/components/button'
import { Card } from '@conar/ui/components/card'
import { MountedSuspense } from '@conar/ui/components/custom/mounted-suspense'
import { Linux } from '@conar/ui/components/icons/linux'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow, { NumberFlowGroup } from '@number-flow/react'
import { RiAppleFill } from '@remixicon/react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { DownloadButton } from '~/components/download-button'
import { getLatestReleaseOptions } from '~/queries'
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
  const { data, isPending } = useQuery(getLatestReleaseOptions)
  const versionNumbers = data ? data.version.slice(1).split('.').map(Number) : [0, 0, 0]

  return (
    <p className={cn('text-sm text-muted-foreground', isPending && 'animate-pulse')}>
      <NumberFlowGroup>
        {versionNumbers.map((number, index) => (
          <NumberFlow
            key={index}
            value={number}
            prefix={index === 0 ? 'Current version ' : ''}
            suffix={index === versionNumbers.length - 1 ? '' : '.'}
          />
        ))}
      </NumberFlowGroup>
    </p>
  )
}

function AllPlatforms() {
  const { data: { mac, linux } } = useSuspenseQuery(getLatestReleaseOptions)

  return (
    <>
      <DownloadOption
        Icon={RiAppleFill}
        type="macos"
        arch="Apple Silicon"
        asset={mac.arm64}
      />
      <DownloadOption
        Icon={RiAppleFill}
        type="macos"
        arch="Intel"
        asset={mac.intel}
      />
      <DownloadOption
        Icon={Linux}
        type="linux"
        arch="deb"
        asset={linux.deb}
      />
      <DownloadOption
        Icon={Linux}
        type="linux"
        arch="AppImage"
        asset={linux.appImage}
      />
    </>
  )
}

function DownloadOption({ Icon, type, arch, asset }: {
  Icon: RemixiconComponentType
  type: OS
  arch?: string
  asset?: {
    url: string
    size: number
  }
}) {
  return (
    <Card className="flex items-center justify-between p-3 sm:p-2 gap-4 sm:gap-8 w-full">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div className="flex items-center justify-center size-8 bg-muted rounded-lg flex-shrink-0">
          <Icon className="text-muted-foreground size-4" />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium text-sm sm:text-base truncate w-full">
            {osMap[type].label}
            {' '}
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
          <Button
            asChild
            size="sm"
            disabled={!asset}
            variant="secondary"
          >
            <a
              href={asset ? asset.url : '#'}
              download
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
    <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-[10vh]">
      <div className="flex flex-col items-center max-w-2xl mx-auto text-center w-full">
        <AppLogoSquare className="size-24 sm:size-32 mb-4 sm:mb-6" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 tracking-tight font-medium px-2">
          Download
          {' '}
          <strong>Conar</strong>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-10 px-2">
          Available for macOS and Linux
        </p>
        <div className="mb-8 sm:mb-12 text-center space-y-2 px-4">
          <DownloadButton />
          <Version />
        </div>
        <div className="w-full max-w-xl px-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-4">All platforms</h2>
          <div className="space-y-2 w-full">
            <MountedSuspense fallback={(
              <>
                <DownloadOption
                  Icon={RiAppleFill}
                  type="macos"
                  arch="Apple Silicon"
                />
                <DownloadOption
                  Icon={RiAppleFill}
                  type="macos"
                  arch="Intel"
                />
                <DownloadOption
                  Icon={Linux}
                  type="linux"
                  arch="deb"
                />
                <DownloadOption
                  Icon={Linux}
                  type="linux"
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
