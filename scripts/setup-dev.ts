/* oxlint-disable no-console */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const __filename = import.meta.filename
const __dirname = import.meta.dirname

const findEnvExampleFiles = (dir: string, r: string[] = []) => {
  const items = fs.readdirSync(dir)

  for (const item of items) {
    if (['node_modules'].includes(item)) {
      continue
    }

    const fullPath = path.join(dir, item)
    const stats = fs.statSync(fullPath)

    if (stats.isDirectory()) {
      findEnvExampleFiles(fullPath, r)
    } else if (item === '.env.example') {
      r.push(fullPath)
    }
  }

  return r
}

const mainCheckoutRoot = (repoRoot: string) =>
  path.dirname(
    path.resolve(
      repoRoot,
      execFileSync('git', ['rev-parse', '--git-common-dir'], {
        cwd: repoRoot,
        encoding: 'utf-8',
      }).trim()
    )
  )

// A worktree copies the main checkout's real .env; .env.example points at localhost services that don't exist
const createEnvFile = (
  envExamplePath: string,
  repoRoot: string,
  mainRoot: string
) => {
  const envPath = path.join(path.dirname(envExamplePath), '.env')
  const mainEnvPath = path.join(mainRoot, path.relative(repoRoot, envPath))

  if (fs.existsSync(envPath)) {
    return false
  }

  try {
    fs.copyFileSync(
      mainRoot !== repoRoot && fs.existsSync(mainEnvPath)
        ? mainEnvPath
        : envExamplePath,
      envPath
    )
    return true
  } catch (error) {
    console.error(
      `Failed to create .env file: ${envPath}`,
      error instanceof Error ? error.message : error
    )
    return false
  }
}

const setupDev = () => {
  const repoRoot = path.join(__dirname, '..')
  const mainRoot = mainCheckoutRoot(repoRoot)
  const appsDir = path.join(repoRoot, 'apps')

  if (!fs.existsSync(appsDir)) {
    console.error('Apps directory not found')
    process.exit(1)
  }

  const envExampleFiles = [
    ...findEnvExampleFiles(appsDir),
    ...findEnvExampleFiles(path.join(repoRoot, 'packages')),
  ]
  const rootEnvExample = path.join(repoRoot, '.env.example')

  if (fs.existsSync(rootEnvExample)) {
    envExampleFiles.unshift(rootEnvExample)
  }

  if (envExampleFiles.length === 0) {
    return
  }

  const created = envExampleFiles.map((file) =>
    createEnvFile(file, repoRoot, mainRoot)
  )

  if (created.some(Boolean)) {
    console.log(`Development environment setup complete!`)
  }
}

if (__filename === process.argv[1] && process.env.NODE_ENV !== 'production') {
  setupDev()
}
