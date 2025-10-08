import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getLatestReleaseOptions } from '~/queries'
import { getOSIsomorphic } from '~/utils/os'

const os = getOSIsomorphic()

export function useDownloadLinks() {
  const { data, isPending } = useQuery(getLatestReleaseOptions)

  const links = useMemo(() => {
    if (!data) {
      return null
    }

    const { mac, linux } = data

    if (os?.type === 'macos' && mac.intel && mac.arm64) {
      return {
        platform: os.label,
        assets: [
          {
            arch: 'Apple Silicon',
            url: mac.arm64.url,
          },
          {
            arch: 'Intel',
            url: mac.intel.url,
          },
        ],
      }
    }

    if (os?.type === 'linux' && linux.deb && linux.appImage && linux.rpm) {
      return {
        platform: os.label,
        assets: [
          {
            arch: 'deb',
            url: linux.deb.url,
          },
          {
            arch: 'AppImage',
            url: linux.appImage.url,
          },
          {
            arch: 'rpm',
            url: linux.rpm.url,
          },
        ],
      }
    }

    // if (os.type === 'windows' && windows.exe) {
    //   return {
    //     platform: os.label,
    //     assets: [
    //       {
    //         arch: 'exe',
    //         url: windows.exe.url,
    //       },
    //     ],
    //   }
    // }

    return null
  }, [data])

  return {
    links,
    isPending,
    os,
  }
}
