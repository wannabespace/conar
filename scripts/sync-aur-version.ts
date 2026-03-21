/* eslint-disable no-console */
import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.join(__dirname, '..')
const DESKTOP_PKG_JSON = path.join(ROOT, 'apps', 'desktop', 'package.json')
const AUR_DIR = path.join(ROOT, 'aur')
const PKGBUILD_PATH = path.join(AUR_DIR, 'PKGBUILD')
const SRCINFO_PATH = path.join(AUR_DIR, '.SRCINFO')

const DEB_URL = 'https://download.conar.app/linux/deb/x64'

function getDesktopVersion(): string {
  const pkg = JSON.parse(fs.readFileSync(DESKTOP_PKG_JSON, 'utf-8'))
  const v = pkg.version
  if (!v || typeof v !== 'string') {
    throw new Error('apps/desktop/package.json has no version')
  }
  return v
}

function updatePkgbuild(version: string, sha256: string | null): boolean {
  const original = fs.readFileSync(PKGBUILD_PATH, 'utf-8')
  const pkgverRe = /^pkgver=.*$/m
  const sha256Re = /^sha256sums_x86_64=\(.*\)$/m
  let content = original.replace(pkgverRe, `pkgver=${version}`)
  if (sha256) {
    content = content.replace(sha256Re, `sha256sums_x86_64=('${sha256}')`)
  }
  const changed = content !== original
  if (changed) {
    fs.writeFileSync(PKGBUILD_PATH, content)
  }
  return changed
}

function updateSrcinfo(version: string, sha256: string | null): boolean {
  let content = fs.readFileSync(SRCINFO_PATH, 'utf-8')

  const pkgverRe = /^(\s*pkgver = ).*$/m
  const sourceRe = /^(\s*source_x86_64 = )conar-[^:]+(::https:\/\/download\.conar\.app\/linux\/deb\/x64)$/m
  const sha256Re = /^(\s*sha256sums_x86_64 = ).*$/m

  let changed = false
  const newPkgver = `$1${version}`
  if (content.replace(pkgverRe, newPkgver) !== content) {
    content = content.replace(pkgverRe, newPkgver)
    changed = true
  }
  const newSource = `$1conar-${version}.deb$2`
  if (content.replace(sourceRe, newSource) !== content) {
    content = content.replace(sourceRe, newSource)
    changed = true
  }
  const newSha256 = sha256 ?? 'SKIP'
  if (content.replace(sha256Re, `$1${newSha256}`) !== content) {
    content = content.replace(sha256Re, `$1${newSha256}`)
    changed = true
  }

  fs.writeFileSync(SRCINFO_PATH, content)
  return changed
}

async function fetchDebSha256(): Promise<string> {
  const res = await fetch(DEB_URL, { redirect: 'follow' })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${DEB_URL}: ${res.status} ${res.statusText}`)
  }
  const buf = Buffer.from(await res.arrayBuffer() as ArrayBuffer)
  return crypto.createHash('sha256').update(buf).digest('hex')
}

async function main() {
  const withChecksum = process.argv.includes('--checksum')

  const version = getDesktopVersion()
  console.log('Desktop version:', version)

  let sha256: string | null = null
  if (withChecksum) {
    console.log('Fetching .deb to compute sha256...')
    sha256 = await fetchDebSha256()
    console.log('sha256:', sha256)
  }

  const pkgbuildChanged = updatePkgbuild(version, sha256)
  const srcinfoChanged = updateSrcinfo(version, sha256)

  if (pkgbuildChanged || srcinfoChanged) {
    console.log('Updated aur/PKGBUILD and/or aur/.SRCINFO to version', version)
    if (!sha256) {
      console.log('Tip: run with --checksum to update sha256sums (recommended for releases).')
    }
  }
  else {
    console.log('AUR files already in sync with version', version)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
