import { Button } from '@tamery/ui/components/button'

import { DownloadButton } from '~/components/download-button'
import { Reveal } from '~/components/reveal'

export const GetStarted = () => (
  <section
    aria-labelledby="get-started-heading"
    className="mx-auto max-w-6xl px-4 py-32 sm:px-6"
  >
    <Reveal className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
      <h2
        id="get-started-heading"
        className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
      >
        Try Tamery today.{' '}
        <span className="text-muted-foreground">
          Free on macOS, Windows and Linux.
        </span>
      </h2>
      <div className="flex shrink-0 flex-wrap gap-2">
        <DownloadButton />
        <Button
          variant="outline"
          size="lg"
          render={
            <a
              href={import.meta.env.VITE_PUBLIC_WEB_URL}
              aria-label="Open Tamery in your browser"
            />
          }
        >
          Open in browser
        </Button>
      </div>
    </Reveal>
  </section>
)
