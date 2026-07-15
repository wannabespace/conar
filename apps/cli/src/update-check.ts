import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PACKAGE_NAME = 'tamery'
const CACHE_DIR = path.join(os.homedir(), '.config', 'tamery')
const CACHE_FILE = path.join(CACHE_DIR, 'update-check.json')
const CHECK_INTERVAL_MS = 1000 * 60 * 60 * 24 // 24 hours

interface UpdateCache {
  lastCheck: number
  latestVersion: string
}

function readCache(): UpdateCache | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8')
    return JSON.parse(raw) as UpdateCache
  } catch {
    return null
  }
}

function writeCache(cache: UpdateCache) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache))
  } catch {}
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`, {
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) return null

    const data = (await res.json()) as { version: string }
    return data.version
  } catch {
    return null
  }
}

function parseVersion(v: string) {
  return v.replace(/^v/, '').split('.').map(Number)
}

function isNewerVersion(current: string, latest: string): boolean {
  const [cMajor = 0, cMinor = 0, cPatch = 0] = parseVersion(current)
  const [lMajor = 0, lMinor = 0, lPatch = 0] = parseVersion(latest)

  if (lMajor !== cMajor) return lMajor > cMajor
  if (lMinor !== cMinor) return lMinor > cMinor
  return lPatch > cPatch
}

export async function checkForUpdate(currentVersion: string): Promise<string | null> {
  const cache = readCache()

  if (cache && Date.now() - cache.lastCheck < CHECK_INTERVAL_MS) {
    return isNewerVersion(currentVersion, cache.latestVersion) ? cache.latestVersion : null
  }

  const latest = await fetchLatestVersion()

  if (!latest) return null

  writeCache({ lastCheck: Date.now(), latestVersion: latest })

  return isNewerVersion(currentVersion, latest) ? latest : null
}
