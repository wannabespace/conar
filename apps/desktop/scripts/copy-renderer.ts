import { cpSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appDist = resolve(root, '../app/dist')
const rendererDest = resolve(root, 'dist-electron/renderer')

if (!existsSync(appDist)) {
  console.error(
    '[@conar/desktop] Renderer source missing: ',
    appDist,
  )
  process.exit(1)
}

cpSync(appDist, rendererDest, { recursive: true, force: true })
