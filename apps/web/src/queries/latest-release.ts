import type { OS } from '@conar/shared/utils/os'
import { Octokit } from '@octokit/rest'
import { queryOptions } from '@tanstack/react-query'
import { createCache } from '~/utils/cache'

const releaseKey = 'OCTOKIT_RELEASE'

async function fetchRelease() {
  const octokit = new Octokit()
  const { data } = await octokit.repos.getLatestRelease({
    owner: 'wannabespace',
    repo: 'conar',
  })

  return data
}

type Release = Awaited<ReturnType<typeof fetchRelease>>

const releaseCache = createCache<Release>({
  key: releaseKey,
  hours: 3,
})

function getFileType(name: string): OS {
  if (name.toLowerCase().endsWith('.dmg'))
    return 'macos'
  if (name.toLowerCase().endsWith('.appimage') || name.toLowerCase().endsWith('.deb') || name.toLowerCase().endsWith('.rpm'))
    return 'linux'
  if (name.toLowerCase().endsWith('.exe'))
    return 'windows'

  return 'unknown'
}

export const getLatestReleaseOptions = queryOptions({
  queryKey: ['octokit', 'getLatestRelease'],
  queryFn: async () => {
    const cached = releaseCache.get()
    if (cached)
      return cached

    const data = await fetchRelease()

    releaseCache.set(data)
    return data
  },
  select: (data) => {
    const version = data.tag_name

    const assets = {
      macos: data.assets?.filter(asset => asset.name.toLowerCase().endsWith('.dmg')) || [],
      linux: data.assets?.filter(asset => asset.name.toLowerCase().endsWith('.deb') || asset.name.toLowerCase().endsWith('.appimage') || asset.name.toLowerCase().endsWith('.rpm')) || [],
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
    const linuxAppImageAsset = links.find(link => link.type === 'linux' && link.name.toLowerCase().endsWith('.appimage'))!
    const linuxRpmAsset = links.find(link => link.type === 'linux' && link.name.toLowerCase().endsWith('.rpm'))!
    // const windowsAsset = links.find(link => link.type === 'windows')

    return {
      version,
      mac: {
        intel: macIntelAsset,
        arm64: macSiliconAsset,
      },
      linux: {
        deb: linuxDebAsset,
        appImage: linuxAppImageAsset,
        rpm: linuxRpmAsset,
      },
      // windows: {
      //   exe: windowsAsset,
      // },
    }
  },
})
