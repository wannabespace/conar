import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { DOWNLOAD_PLATFORMS } from '~/components/download-files'
import { seo } from '~/utils/seo'

import { PlatformCard } from './-components/platform-card'

const { useLoaderData } = getRouteApi('/_layout')

const DownloadPage = () => {
  const os = useLoaderData()
  const platforms = DOWNLOAD_PLATFORMS.toSorted(
    (a, b) => Number(b.os === os?.type) - Number(a.os === os?.type)
  )

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24">
      <header className="flex max-w-2xl flex-col items-start gap-4">
        <img src="/logo.png" alt="" className="size-16" />
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Download Tamery
        </h1>
        <p className="text-muted-foreground text-base text-pretty sm:text-lg">
          A native app for macOS, Windows and Linux. Sign in once and your
          connections follow you to every device.
        </p>
      </header>
      <div className="mt-16 grid items-start gap-4 md:grid-cols-3">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.os}
            platform={platform}
            isCurrent={platform.os === os?.type}
          />
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
