import {
  CHANGELOG,
  changelogSections,
  getUnseenReleases,
} from '@tamery/shared/changelog'
import type { ChangelogRelease } from '@tamery/shared/changelog'
import { Button } from '@tamery/ui/components/button'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { type } from 'arktype'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'

import { posthog } from '~/lib/posthog'

import { updatesStore } from './updates-observer'

const seenChangelogVersion = createWebStorageValue({
  defaultValue: null,
  key: 'changelog-seen-version',
  schema: type('string | null'),
  type: 'localStorage',
})

const ReleaseNotes = ({ release }: { release: ChangelogRelease }) => (
  <div className="flex flex-col gap-4">
    {changelogSections(release.items).map((section) => (
      <section key={section.kind} className="flex flex-col gap-1.5">
        <h3 className="text-muted-foreground text-xs">{section.label}</h3>
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm">
          {section.texts.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </section>
    ))}
  </div>
)

export const WhatsNew = () => {
  const version = useSubscription(updatesStore, {
    selector: (state) => state.version,
  })
  const seen = useSubscription(seenChangelogVersion)
  const releases = getUnseenReleases(CHANGELOG, version, seen)
  const releaseKey = releases.map((release) => release.version).join(' ')
  const pending = !import.meta.env.VITE_TEST && releases.length > 0
  const [shown, setShown] = useState<readonly ChangelogRelease[]>([])
  const [shownKey, setShownKey] = useState('')
  if (pending && releaseKey !== shownKey) {
    setShownKey(releaseKey)
    setShown(releases)
  }
  const continueRef = useRef<HTMLButtonElement>(null)

  const dismiss = () => {
    if (seenChangelogVersion.get() === version) {
      return
    }
    seenChangelogVersion.set(version)
    posthog.capture('changelog_dismissed', { version })
  }

  const [newest] = shown
  const oldest = shown.at(-1)

  return (
    <Dialog
      open={pending && shownKey === releaseKey && shown.length > 0}
      onOpenChange={(next) => {
        if (!next) {
          dismiss()
        }
      }}
      onOpenChangeComplete={(next) => {
        if (!next) {
          setShown([])
        }
      }}
    >
      {shown.length > 0 && newest && oldest && (
        <DialogContent initialFocus={continueRef}>
          <DialogHeader>
            <DialogTitle>What&apos;s new</DialogTitle>
            <DialogDescription>
              {shown.length === 1
                ? `Version ${newest.version}`
                : `${oldest.version} through ${newest.version}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="flex flex-col gap-6">
              {shown.map((release) => (
                <div key={release.version} className="flex flex-col gap-3">
                  {shown.length > 1 && (
                    <h2 className="text-sm font-medium">{release.version}</h2>
                  )}
                  <ReleaseNotes release={release} />
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button ref={continueRef} onClick={dismiss}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
