import { CHANGELOG, changelogSections } from '@tamery/shared/changelog'
import { SOCIAL_LINKS } from '@tamery/shared/constants'
import { Badge } from '@tamery/ui/components/badge'
import { createFileRoute } from '@tanstack/react-router'

import { seo } from '~/utils/seo'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const releaseDate = (iso: string) => {
  const [year, month, day] = iso.split('-')
  const name = MONTHS[Number(month) - 1]
  return name ? `${name} ${Number(day)}, ${year}` : iso
}

const ReleasesPage = () => (
  <main className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24">
    <header className="mb-16 flex max-w-2xl flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Releases
      </h1>
      <p className="text-muted-foreground text-base text-pretty sm:text-lg">
        New features, fixes and improvements in every version of Tamery.
      </p>
    </header>
    <ol className="flex flex-col gap-16">
      {CHANGELOG.map((release, index) => (
        <li
          key={release.version}
          className="grid gap-3 md:grid-cols-[12rem_1fr] md:gap-12"
        >
          <div className="flex items-center gap-2 md:sticky md:top-24 md:flex-col md:items-start md:self-start md:pt-1.5">
            <time
              dateTime={release.date}
              className="text-muted-foreground text-sm"
            >
              {releaseDate(release.date)}
            </time>
            {index === 0 && <Badge variant="secondary">Latest</Badge>}
          </div>
          <article className="flex max-w-3xl min-w-0 flex-col gap-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              {release.version}
            </h2>
            {changelogSections(release.items).map((section) => (
              <section key={section.kind} className="flex flex-col gap-2">
                <h3 className="text-muted-foreground text-sm">
                  {section.label}
                </h3>
                <ul className="flex list-disc flex-col gap-1.5 pl-4 text-base">
                  {section.texts.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </section>
            ))}
          </article>
        </li>
      ))}
    </ol>
    <p className="text-muted-foreground mt-16 text-sm">
      Older versions are on{' '}
      <a
        href={`${SOCIAL_LINKS.GITHUB}/releases`}
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
      .
    </p>
  </main>
)

export const Route = createFileRoute('/_layout/releases')({
  component: ReleasesPage,
  head: () =>
    seo({
      title: 'Releases - Tamery',
      description:
        'What changed in each version of Tamery: new features, fixes and improvements.',
      image: '/og-image.png',
      path: '/releases',
    }),
})
