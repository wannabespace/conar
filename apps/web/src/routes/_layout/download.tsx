import type { OS } from '@connnect/shared/utils/os'
import type { ReleaseAsset } from '~/utils/releases'
import { getOS } from '@connnect/shared/utils/os'
import { AppLogoGradient } from '@connnect/ui/components/brand/app-logo-gradient'
import { Button } from '@connnect/ui/components/button'
import { Card } from '@connnect/ui/components/card'
import { DotsBg } from '@connnect/ui/components/custom/dots-bg'
import { RiAppleFill, RiDownloadLine, RiWindowsFill } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getHeader } from '@tanstack/react-start/server'
import { useMemo } from 'react'
import { LinuxLogo } from '~/assets/linux-logo'
import { getLatestRelease } from '~/utils/releases'
import { seo } from '~/utils/seo'

const getRelease = createServerFn({ method: 'GET' }).handler(getLatestRelease)
const getOSFn = createServerFn({ method: 'GET' }).handler(() => getOS(getHeader('user-agent')))

export const Route = createFileRoute('/_layout/download')({
  component: RouteComponent,
  loader: async () => {
    const [releaseInfo, os] = await Promise.all([getRelease(), getOSFn()])
    const assets: Partial<Record<OS, ReleaseAsset[]>> = {
      macos: releaseInfo.assets.filter(asset => asset.name.toLowerCase().endsWith('.dmg')),
      linux: releaseInfo.assets.filter(asset => asset.name.toLowerCase().endsWith('.appimage')),
      windows: releaseInfo.assets.filter(asset => asset.name.toLowerCase().endsWith('.exe')),
    }
    return { assets, version: releaseInfo.tag_name, os }
  },
  head: ({ loaderData }) => {
    return {
      meta: seo({
        title: `Download Connnect - ${loaderData.version}`,
      }),
    }
  },
  pendingComponent: () => {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground px-4 pt-40 pb-16">
        <div className="flex flex-col items-center max-w-2xl mx-auto text-center">
          <AppLogoGradient className="size-32 mb-6" />
        </div>
      </div>
    )
  },
})

function getFileType(name: string): OS {
  if (name.toLowerCase().endsWith('.dmg'))
    return 'macos'
  if (name.toLowerCase().endsWith('.appimage'))
    return 'linux'
  if (name.toLowerCase().endsWith('.exe'))
    return 'windows'

  return 'unknown'
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

function RouteComponent() {
  const { assets, version, os } = Route.useLoaderData()

  const links = useMemo(() => {
    return [
      ...(assets.macos || []),
      ...(assets.linux || []),
      ...(assets.windows || []),
    ].map(asset => ({
      name: asset.name,
      url: asset.browser_download_url,
      type: getFileType(asset.name),
      size: asset.size,
    }))
  }, [assets])

  const macSiliconAsset = useMemo(() =>
    links.find(link => link.type === 'macos' && link.name.toLowerCase().includes('arm64')), [links])

  const macIntelAsset = useMemo(() =>
    links.find(link => link.type === 'macos' && link.name.toLowerCase().includes('x64')), [links])

  const linuxAsset = useMemo(() =>
    links.find(link => link.type === 'linux'), [links])

  const windowsAsset = useMemo(() =>
    links.find(link => link.type === 'windows'), [links])

  const downloadLinks = useMemo((): { label: string, url: string }[] => {
    if (os === 'macos' && macIntelAsset && macSiliconAsset) {
      return [
        {
          label: 'macOS (Intel)',
          url: macIntelAsset.url,
        },
        {
          label: 'macOS (Apple Silicon)',
          url: macSiliconAsset.url,
        },
      ]
    }

    if (os === 'linux' && linuxAsset) {
      return [
        {
          label: 'Linux',
          url: linuxAsset.url,
        },
      ]
    }

    if (os === 'windows' && windowsAsset) {
      return [
        {
          label: 'Windows',
          url: windowsAsset.url,
        },
      ]
    }

    return []
  }, [os, macIntelAsset, macSiliconAsset, linuxAsset, windowsAsset])

  return (
    <div className="flex flex-col items-center justify-center px-4 pt-40 pb-16">
      <DotsBg
        className="absolute -z-10 inset-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <div className="flex flex-col items-center max-w-2xl mx-auto text-center">
        <AppLogoGradient className="size-32 mb-6" />
        <h1 className="text-4xl font-bold mb-3 tracking-tight">Download Connnect</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Available for macOS and Linux (Windows coming soon)
        </p>
        <div className="mb-12 text-center">
          {downloadLinks.length > 0
            ? (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {downloadLinks.map(link => (
                    <Button
                      key={link.url}
                      asChild
                      size="lg"
                    >
                      <a href={link.url} download className="flex items-center justify-center gap-2">
                        <RiDownloadLine className="size-5" />
                        {link.label}
                      </a>
                    </Button>
                  ))}
                </div>
              )
            : (
                <p className="text-muted-foreground">No downloads found for this release.</p>
              )}
          <p className="text-sm text-muted-foreground mt-3">
            Current release:
            {' '}
            <span className="font-medium">{version}</span>
          </p>
        </div>
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold text-center mb-4">All platforms</h2>
          <div className="grid gap-4">
            {macSiliconAsset && (
              <DownloadOption
                icon={<RiAppleFill className="text-muted-foreground" />}
                platform="macOS (Apple Silicon)"
                version={version}
                asset={macSiliconAsset}
              />
            )}
            {macIntelAsset && (
              <DownloadOption
                icon={<RiAppleFill className="text-muted-foreground" />}
                platform="macOS (Intel)"
                version={version}
                asset={macIntelAsset}
              />
            )}
            {linuxAsset && (
              <DownloadOption
                icon={<LinuxLogo className="fill-muted-foreground size-5" />}
                platform="Linux"
                version={version}
                asset={linuxAsset}
              />
            )}
            {windowsAsset && (
              <DownloadOption
                icon={<RiWindowsFill className="text-muted-foreground" />}
                platform="Windows"
                version={version}
                asset={windowsAsset}
              />
            )}
            {!macSiliconAsset && !macIntelAsset && !windowsAsset && !linuxAsset && (
              <p className="text-muted-foreground text-center col-span-full mt-4">No downloads found for this release.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DownloadOption({ icon, platform, version, asset }: {
  icon: React.ReactNode
  platform: string
  version: string
  asset: {
    name: string
    url: string
    type: OS
    size: number
  }
}) {
  return (
    <Card className="flex items-center justify-between p-4 gap-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center size-10 bg-muted rounded-lg">
          {icon}
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium">{platform}</span>
          <span className="text-sm text-muted-foreground">{version}</span>
        </div>
      </div>
      <Button asChild size="sm" variant="outline">
        <a href={asset.url} download className="flex items-center gap-1.5">
          <RiDownloadLine />
          Download
          <span className="text-xs text-muted-foreground">
            (
            {formatBytes(asset.size)}
            )
          </span>
        </a>
      </Button>
    </Card>
  )
}
