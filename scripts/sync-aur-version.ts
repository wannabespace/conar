import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.join(import.meta.dirname, '..')
const pkgbuildPath = path.join(rootDir, 'aur', 'PKGBUILD')

const { version } = JSON.parse(
  fs.readFileSync(
    path.join(rootDir, 'apps', 'desktop', 'package.json'),
    'utf-8'
  )
)
const pkgbuild = fs.readFileSync(pkgbuildPath, 'utf-8')

fs.writeFileSync(
  pkgbuildPath,
  pkgbuild.replace(/^pkgver=.*$/mu, `pkgver=${version}`)
)
