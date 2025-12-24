/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getPnpmVersion() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  const packageManager = packageJson.packageManager
  if (!packageManager || !packageManager.startsWith('pnpm@')) {
    throw new Error('packageManager field not found or invalid in package.json')
  }

  return packageManager.replace('pnpm@', '')
}

function updateTodesktopJson(version: string) {
  const todesktopPath = path.join(__dirname, '..', 'apps', 'desktop', 'todesktop.json')
  const todesktop = JSON.parse(fs.readFileSync(todesktopPath, 'utf-8'))

  if (todesktop.pnpmVersion === version) {
    return false
  }

  todesktop.pnpmVersion = version
  fs.writeFileSync(todesktopPath, `${JSON.stringify(todesktop, null, 2)}\n`)
  return true
}

function updateWorkflowYaml(filePath: string, version: string) {
  const content = fs.readFileSync(filePath, 'utf-8')

  const versionRegex = /(version:\s*)([\d.]+)/g
  const newContent = content.replace(versionRegex, (match, prefix, oldVersion) => {
    if (oldVersion === version) {
      return match
    }
    return `${prefix}${version}`
  })

  if (content === newContent) {
    return false
  }

  fs.writeFileSync(filePath, newContent)
  return true
}

function syncPnpmVersion() {
  try {
    const version = getPnpmVersion()

    const rootDir = path.join(__dirname, '..')

    const todesktopUpdated = updateTodesktopJson(version)
    const lintCheckUpdated = updateWorkflowYaml(
      path.join(rootDir, '.github', 'workflows', 'lint-check.yml'),
      version,
    )
    const releaseUpdated = updateWorkflowYaml(
      path.join(rootDir, '.github', 'workflows', 'release.yml'),
      version,
    )

    if (todesktopUpdated || lintCheckUpdated || releaseUpdated) {
      console.log('✓ Updated pnpm version in:')
      if (todesktopUpdated)
        console.log('  - apps/desktop/todesktop.json')
      if (lintCheckUpdated)
        console.log('  - .github/workflows/lint-check.yml')
      if (releaseUpdated)
        console.log('  - .github/workflows/release.yml')
    }
  }
  catch (error) {
    console.error('Failed to sync pnpm version:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

if (__filename === process.argv[1]) {
  syncPnpmVersion()
}
