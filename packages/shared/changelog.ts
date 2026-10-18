const changelogKindOrder = ['new', 'improved', 'fixed'] as const

export const changelogKindLabel = {
  fixed: 'Fixed',
  improved: 'Improved',
  new: 'New',
} as const

export type ChangelogKind = (typeof changelogKindOrder)[number]

export interface ChangelogItem {
  kind: ChangelogKind
  text: string
}

export interface ChangelogRelease {
  date: string
  items: readonly ChangelogItem[]
  version: string
}

// The site, the in-app What's New dialog and the ToDesktop release webhook
// all read this list. A version missing from it ships GitHub's generated
// pull-request list instead.
export const CHANGELOG = [
  {
    date: '2026-10-18',
    items: [
      {
        kind: 'new',
        text: 'Tamery is the new name. This is the first release.',
      },
      {
        kind: 'new',
        text: 'Edit cells in the table, like a spreadsheet, and peek at the row a foreign key points to.',
      },
      {
        kind: 'new',
        text: 'Change the schema on the visualizer. Nothing runs until you apply it.',
      },
      {
        kind: 'new',
        text: 'The SQL editor completes from your schema, and AI can write or fix a query.',
      },
      {
        kind: 'new',
        text: 'Run a transaction one statement at a time, then commit or roll it back.',
      },
      {
        kind: 'new',
        text: 'Connect to SQLite, including Turso and Cloudflare D1.',
      },
      {
        kind: 'new',
        text: 'An MCP server lets agents query your databases. A write waits until you approve it.',
      },
      {
        kind: 'new',
        text: 'Workspaces keep connections in separate places.',
      },
      {
        kind: 'new',
        text: 'Paste a connection string, an .env file, or a psql command and Tamery fills the form.',
      },
      {
        kind: 'new',
        text: 'Sign in with an email code, or continue without an account.',
      },
      {
        kind: 'improved',
        text: 'Edits you make offline are sent when you are back online.',
      },
      {
        kind: 'improved',
        text: 'Everything you do with the mouse has a key, and Escape walks back to the navigator.',
      },
      {
        kind: 'improved',
        text: 'Menus are native on macOS, and a table or connection can open in its own window.',
      },
      {
        kind: 'improved',
        text: 'Panels resize, and the macOS window can be transparent.',
      },
    ],
    version: '0.99.0',
  },
] as const satisfies readonly ChangelogRelease[]

export const changelogSections = (items: readonly ChangelogItem[]) =>
  changelogKindOrder.flatMap((kind) => {
    const texts = items
      .filter((item) => item.kind === kind)
      .map((item) => item.text)
    return texts.length > 0
      ? [{ kind, label: changelogKindLabel[kind], texts }]
      : []
  })

export const formatReleaseNotes = (release: ChangelogRelease) =>
  changelogSections(release.items)
    .map(
      (section) =>
        `## ${section.label}\n${section.texts.map((text) => `- ${text}`).join('\n')}`
    )
    .join('\n\n')

const compareVersions = (left: string, right: string) => {
  const a = left.split('.').map(Number)
  const b = right.split('.').map(Number)
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const delta = (a[index] ?? 0) - (b[index] ?? 0)
    if (delta !== 0) {
      return delta
    }
  }
  return 0
}

export const getUnseenReleases = (
  releases: readonly ChangelogRelease[],
  appVersion: string,
  seen: string | null
) => {
  const available = releases.filter(
    (release) => compareVersions(release.version, appVersion) <= 0
  )
  const unseen =
    seen === null
      ? available.filter(
          (release) => compareVersions(release.version, appVersion) === 0
        )
      : available.filter(
          (release) => compareVersions(release.version, seen) > 0
        )

  return unseen.toSorted((a, b) => compareVersions(b.version, a.version))
}
