import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appDir = path.join(__dirname, '..')
const envPath = path.join(appDir, '.env')
const composePath = path.join(appDir, 'docker-compose.yml')
const dockerBinary = process.platform === 'win32' ? 'docker.exe' : 'docker'
const mode = process.argv[2] ?? 'dev'

function createEnvContents() {
  const postgresUser = 'infisical'
  const postgresPassword = 'infisical'
  const postgresDb = 'infisical'

  return [
    `ENCRYPTION_KEY=${randomBytes(16).toString('hex')}`,
    `AUTH_SECRET=${randomBytes(32).toString('base64')}`,
    `POSTGRES_PASSWORD=${postgresPassword}`,
    `POSTGRES_USER=${postgresUser}`,
    `POSTGRES_DB=${postgresDb}`,
    `DB_CONNECTION_URI=postgres://${postgresUser}:${postgresPassword}@db:5432/${postgresDb}`,
    'REDIS_URL=redis://redis:6379',
    'SITE_URL=http://localhost:8081',
    '',
  ].join('\n')
}

function ensureEnvFile() {
  if (existsSync(envPath)) {
    const currentEnv = readFileSync(envPath, 'utf8')

    if (!currentEnv.includes('ENCRYPTION_KEY=replace-me') && !currentEnv.includes('AUTH_SECRET=replace-me')) {
      return
    }

    writeFileSync(envPath, createEnvContents(), 'utf8')
    console.log(`Refreshed ${envPath}`)
    return
  }

  writeFileSync(envPath, createEnvContents(), 'utf8')
  console.log(`Created ${envPath}`)
}

function getComposeArgs(...extraArgs) {
  return ['compose', '-f', composePath, '--env-file', envPath, ...extraArgs]
}

function runDocker(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(dockerBinary, args, {
      cwd: appDir,
      stdio: 'inherit',
    })

    const forwardSignal = (signal) => {
      if (!child.killed) {
        child.kill(signal)
      }
    }

    const cleanup = () => {
      process.off('SIGINT', onSigint)
      process.off('SIGTERM', onSigterm)
    }

    const onSigint = () => forwardSignal('SIGINT')
    const onSigterm = () => forwardSignal('SIGTERM')

    process.on('SIGINT', onSigint)
    process.on('SIGTERM', onSigterm)

    child.on('error', (error) => {
      cleanup()

      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        reject(new Error('Docker is required to run the Infisical workspace.'))
        return
      }

      reject(error)
    })

    child.on('exit', (code, signal) => {
      cleanup()

      if (signal) {
        process.kill(process.pid, signal)
        return
      }

      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`docker ${args.join(' ')} exited with code ${code}`))
    })
  })
}

switch (mode) {
  case 'prepare':
    ensureEnvFile()
    break
  case 'dev':
    ensureEnvFile()
    await runDocker(getComposeArgs('up', '--remove-orphans'))
    break
  case 'start':
    ensureEnvFile()
    await runDocker(getComposeArgs('up', '-d', '--remove-orphans'))
    break
  case 'stop':
    await runDocker(getComposeArgs('down'))
    break
  default:
    console.error('Usage: node ./scripts/manage.mjs <dev|start|stop|prepare>')
    process.exit(1)
}
