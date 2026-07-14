/* oxlint-disable no-console */
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const lockfilePath = path.join(__dirname, '..', 'pnpm-lock.yaml')

const missingIntegrityPattern = /resolution: \{tarball: (https?:\/\/[^\s}]+)\}/g

async function tarballIntegrity(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  const hash = createHash('sha512').update(bytes).digest('base64')

  return `sha512-${hash}`
}

export async function fixPnpmTarballIntegrity() {
  const lockfile = fs.readFileSync(lockfilePath, 'utf-8')
  const missing = [...lockfile.matchAll(missingIntegrityPattern)]

  if (missing.length === 0) {
    return 0
  }

  let updated = lockfile

  for (const match of missing) {
    const url = match[1]!
    // Sequential by design: the lockfile string is rewritten incrementally per match
    // eslint-disable-next-line no-await-in-loop
    const integrity = await tarballIntegrity(url)
    updated = updated.replace(
      `resolution: {tarball: ${url}}`,
      `resolution: {integrity: ${integrity}, tarball: ${url}}`,
    )
    console.log(`✓ ${url}`)
    console.log(`  ${integrity}`)
  }

  fs.writeFileSync(lockfilePath, updated)
  return missing.length
}

if (__filename === process.argv[1]) {
  fixPnpmTarballIntegrity()
    // oxlint-disable-next-line promise/always-return
    .then(count => {
      if (count === 0) {
        console.log('No tarball entries missing integrity.')
        return
      }

      console.log(`Updated ${count} lockfile ${count === 1 ? 'entry' : 'entries'}.`)
    })
    .catch(error => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
