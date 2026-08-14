import { cpSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const appDist = path.resolve(root, '../app/dist-desktop')
const rendererDest = path.resolve(root, 'dist-electron/renderer')

if (!existsSync(appDist)) {
  console.error('[@tamery/desktop] Renderer source missing:', appDist)
  process.exit(1)
}

cpSync(appDist, rendererDest, { force: true, recursive: true })
