import { execFileSync } from 'node:child_process'
import process from 'node:process'

const portlessUrl = (portlessName: string) => {
  try {
    return execFileSync('portless', ['get', portlessName], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'inherit'],
    }).trim()
  } catch {
    return ''
  }
}

const setWhenMissing = (envKey: string, url: string | undefined) => {
  if (url && !process.env[envKey]) {
    process.env[envKey] = url
  }
}

export const setupPortlessEnvs = <EnvKey extends string>(
  portlessNameByEnvKey: Record<EnvKey, string>
) => {
  for (const [envKey, portlessName] of Object.entries<string>(
    portlessNameByEnvKey
  )) {
    if (!process.env[envKey]) {
      setWhenMissing(envKey, portlessUrl(portlessName))
    }
  }

  return {
    defaults: (urlByEnvKey: Partial<Record<EnvKey, string>>) => {
      for (const [envKey, url] of Object.entries<string | undefined>(
        urlByEnvKey
      )) {
        setWhenMissing(envKey, url)
      }
    },
  }
}
