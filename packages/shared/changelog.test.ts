import { describe, expect, it } from 'bun:test'

import type { ChangelogRelease } from './changelog'
import { getUnseenReleases } from './changelog'

const releases: ChangelogRelease[] = [
  { date: '2026-05-01', items: [], version: '0.31.0' },
  { date: '2026-05-04', items: [], version: '0.31.4' },
  { date: '2026-06-26', items: [], version: '0.32.0' },
  { date: '2026-10-18', items: [], version: '0.99.0' },
  { date: '2026-11-01', items: [], version: '0.100.0' },
]

describe('getUnseenReleases', () => {
  it('shows only the running version the first time', () => {
    expect(
      getUnseenReleases(releases, '0.99.0', null).map(
        (release) => release.version
      )
    ).toEqual(['0.99.0'])
  })

  it('shows nothing the first time when this version has no notes', () => {
    expect(getUnseenReleases(releases, '0.50.0', null)).toEqual([])
  })

  it('shows every note since the last one the user dismissed, newest first', () => {
    expect(
      getUnseenReleases(releases, '0.99.0', '0.31.0').map(
        (release) => release.version
      )
    ).toEqual(['0.99.0', '0.32.0', '0.31.4'])
  })

  it('hides a version the app has not reached yet', () => {
    expect(
      getUnseenReleases(releases, '0.32.0', '0.31.0').map(
        (release) => release.version
      )
    ).toEqual(['0.32.0', '0.31.4'])
  })

  it('shows nothing once the running version was dismissed', () => {
    expect(getUnseenReleases(releases, '0.99.0', '0.99.0')).toEqual([])
  })

  it('compares version numbers, not text', () => {
    expect(
      getUnseenReleases(releases, '0.100.0', '0.99.0').map(
        (release) => release.version
      )
    ).toEqual(['0.100.0'])
  })
})
