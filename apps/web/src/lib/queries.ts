import type { OS } from '@conar/shared/utils/os'
import { Octokit } from '@octokit/rest'
import { queryOptions } from '@tanstack/react-query'
import { subHours } from 'date-fns'

const repoKey = 'OCTOKIT_REPO'
const releaseKey = 'OCTOKIT_RELEASE'

interface Persisted<T> {
  data: T
  timestamp: number
}

type Repo = Awaited<ReturnType<InstanceType<typeof Octokit>['repos']['get']>>['data']
type Release = Awaited<ReturnType<InstanceType<typeof Octokit>['repos']['getLatestRelease']>>['data']

const repoQuery = {
  get() {
    if (typeof window === 'undefined')
      return

    const stored = localStorage.getItem(repoKey)
    if (!stored)
      return

    const persisted = JSON.parse(stored) as Persisted<Repo>
    const threeHoursAgo = subHours(new Date(), 3).getTime()

    if (persisted.timestamp < threeHoursAgo) {
      localStorage.removeItem(repoKey)
      return
    }

    return persisted.data
  },
  set(data: Repo) {
    if (typeof window === 'undefined')
      return

    const persisted: Persisted<Repo> = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(repoKey, JSON.stringify(persisted))
  },
  async fetch(): Promise<Repo> {
    const cached = repoQuery.get()
    if (cached)
      return cached

    const octokit = new Octokit()
    const { data } = await octokit.repos.get({
      owner: 'wannabespace',
      repo: 'conar',
    })

    repoQuery.set(data)
    return data
  },
}

const releaseQuery = {
  get() {
    if (typeof window === 'undefined')
      return

    const stored = localStorage.getItem(releaseKey)
    if (!stored)
      return

    const persisted = JSON.parse(stored) as Persisted<Release>
    const threeHoursAgo = subHours(new Date(), 3).getTime()

    if (persisted.timestamp < threeHoursAgo) {
      localStorage.removeItem(releaseKey)
      return
    }

    return persisted.data
  },
  set(data: Release) {
    if (typeof window === 'undefined')
      return

    const persisted: Persisted<Release> = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(releaseKey, JSON.stringify(persisted))
  },
  async fetch(): Promise<Release> {
    const cached = releaseQuery.get()
    if (cached)
      return cached

    const octokit = new Octokit()
    const { data } = await octokit.repos.getLatestRelease({
      owner: 'wannabespace',
      repo: 'conar',
    })

    releaseQuery.set(data)
    return data
  },
}

export const getRepoQuery = queryOptions({
  queryKey: ['octokit', 'get'],
  queryFn: () => repoQuery.fetch(),
})

function getFileType(name: string): OS {
  if (name.toLowerCase().endsWith('.dmg'))
    return 'macos'
  if (name.toLowerCase().endsWith('.appimage') || name.toLowerCase().endsWith('.deb'))
    return 'linux'
  if (name.toLowerCase().endsWith('.exe'))
    return 'windows'

  return 'unknown'
}

export const getLatestReleaseQuery = queryOptions({
  queryKey: ['octokit', 'getLatestRelease'],
  queryFn: () => releaseQuery.fetch(),
  select: (data) => {
    const version = data.tag_name
    const assets = {
      macos: data.assets?.filter(asset => asset.name.toLowerCase().endsWith('.dmg')) || [],
      linux: data.assets?.filter(asset => asset.name.toLowerCase().endsWith('.deb') || asset.name.toLowerCase().endsWith('.appimage')) || [],
      windows: data.assets?.filter(asset => asset.name.toLowerCase().endsWith('.exe')) || [],
    }

    const links = [
      ...(assets.macos || []),
      ...(assets.linux || []),
      ...(assets.windows || []),
    ].map(asset => ({
      name: asset.name,
      url: asset.browser_download_url,
      type: getFileType(asset.name),
      size: asset.size,
    }))

    const macSiliconAsset = links.find(link => link.type === 'macos' && link.name.toLowerCase().includes('arm64'))!
    const macIntelAsset = links.find(link => link.type === 'macos' && link.name.toLowerCase().includes('x64'))!
    const linuxDebAsset = links.find(link => link.type === 'linux' && link.name.toLowerCase().endsWith('.deb'))!
    const linuxAppimageAsset = links.find(link => link.type === 'linux' && link.name.toLowerCase().endsWith('.appimage'))!
    // const windowsAsset = links.find(link => link.type === 'windows')

    return {
      version,
      mac: {
        intel: macIntelAsset,
        arm64: macSiliconAsset,
      },
      linux: {
        deb: linuxDebAsset,
        appimage: linuxAppimageAsset,
      },
      // windows: {
      //   exe: windowsAsset,
      // },
    }
  },
})
