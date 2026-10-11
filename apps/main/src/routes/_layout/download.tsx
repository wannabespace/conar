import { ArrowRight01Icon, Download04Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { BREW_INSTALL_COMMAND } from '@tamery/shared/constants'
import { osMap } from '@tamery/shared/os'
import { Badge } from '@tamery/ui/components/badge'
import { AppLogoSquare } from '@tamery/ui/components/brand/app-logo-square'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  smallItemInsetClassName,
} from '@tamery/ui/components/item'
import { cn } from '@tamery/ui/lib/utils'
import { createFileRoute } from '@tanstack/react-router'

import { DownloadButton } from '~/components/download-button'
import type { DownloadPlatform } from '~/components/download-files'
import { DOWNLOAD_PLATFORMS } from '~/components/download-files'
import { getOSIsomorphic } from '~/utils/os'
import { seo } from '~/utils/seo'

const os = getOSIsomorphic()

const HomebrewInstall = () => (
  <div className="border-foreground/6 border-t">
    <div
      className={cn(
        smallItemInsetClassName,
        'flex h-11 items-center justify-between gap-2 pr-2'
      )}
    >
      <span className="text-muted-foreground text-sm">
        Or install with Homebrew
      </span>
      <CopyIconButton text={BREW_INSTALL_COMMAND} label="Copy command" />
    </div>
    <CodeBlock
      variant="inset"
      padding="item"
      size="xs"
      language="bash"
      code={BREW_INSTALL_COMMAND}
    />
  </div>
)

const PlatformCard = ({ platform }: { platform: DownloadPlatform }) => (
  <section className="bg-background ring-foreground/4 overflow-hidden rounded-2xl shadow-xs ring">
    <header
      className={cn(
        smallItemInsetClassName,
        'border-foreground/6 flex items-center gap-3 border-b py-4'
      )}
    >
      <div className="bg-popover ring-foreground/4 text-muted-foreground flex size-9 items-center justify-center rounded-xl shadow-xs ring [&_svg]:size-4.5">
        {platform.icon}
      </div>
      <h2 className="text-base font-medium">{osMap[platform.os].label}</h2>
      {platform.os === os?.type && (
        <Badge variant="secondary" className="ml-auto">
          Your system
        </Badge>
      )}
    </header>
    <div className="flex flex-col">
      {platform.files.map((file) => (
        <Item
          key={file.link}
          variant="grouped"
          size="sm"
          className="text-foreground cursor-default"
          render={
            <a
              href={file.link}
              download
              aria-label={`Download ${file.label}`}
            />
          }
        >
          <ItemContent>
            <ItemTitle>{file.label}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <HugeiconsIcon
              icon={Download04Icon}
              strokeWidth={2}
              className="text-muted-foreground size-4"
            />
          </ItemActions>
        </Item>
      ))}
    </div>
    {platform.os === 'macos' && <HomebrewInstall />}
  </section>
)

const DownloadPage = () => {
  const platforms = DOWNLOAD_PLATFORMS.toSorted(
    (a, b) => Number(b.os === os?.type) - Number(a.os === os?.type)
  )

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24">
      <header className="flex max-w-2xl flex-col items-start gap-4">
        <AppLogoSquare className="size-16" aria-hidden="true" />
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Download Tamery
        </h1>
        <p className="text-muted-foreground text-base text-pretty sm:text-lg">
          A native app for macOS, Windows and Linux. Sign in once and your
          connections follow you to every device.
        </p>
        <DownloadButton className="mt-2" />
      </header>
      <div className="mt-16 grid items-start gap-4 md:grid-cols-3">
        {platforms.map((platform) => (
          <PlatformCard key={platform.os} platform={platform} />
        ))}
      </div>
      <p className="text-muted-foreground mt-10 text-sm">
        Prefer the browser?{' '}
        <a
          href={import.meta.env.VITE_PUBLIC_WEB_URL}
          className="inline-flex items-center gap-0.5"
        >
          Open Tamery on the web
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
        </a>
      </p>
    </main>
  )
}

export const Route = createFileRoute('/_layout/download')({
  component: DownloadPage,
  head: () =>
    seo({
      title: 'Download Tamery for macOS, Windows and Linux',
      description:
        'Download Tamery for macOS (Apple Silicon and Intel), Windows, and Linux. Available as DMG, EXE, DEB, RPM, and AppImage.',
      image: '/og-image.png',
      path: '/download',
    }),
})
