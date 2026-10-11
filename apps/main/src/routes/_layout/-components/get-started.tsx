import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { MeshBackground } from '@tamery/ui/components/custom/mesh-background'

import { DownloadButton } from '~/components/download-button'
import { Reveal } from '~/components/reveal'

export const GetStarted = () => (
  <section
    aria-labelledby="get-started-heading"
    className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6"
  >
    <Reveal className="bg-primary relative isolate flex flex-col items-center gap-6 overflow-hidden rounded-3xl px-6 py-20 text-center text-white sm:py-28">
      <MeshBackground className="-z-10" />
      <AppLogo aria-hidden className="size-12" />
      <h2
        id="get-started-heading"
        className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
      >
        Try Tamery today.
      </h2>
      <p className="max-w-md text-lg text-pretty text-white/80">
        Free for macOS, Windows and Linux, or right in your browser.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <DownloadButton variant="outline" />
        <a
          href={import.meta.env.VITE_PUBLIC_WEB_URL}
          aria-label="Open Tamery in your browser"
          className="group inline-flex items-center gap-1 text-sm font-medium text-white"
        >
          Open in browser
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </a>
      </div>
    </Reveal>
  </section>
)
