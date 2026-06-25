const { rm, writeFile } = require('node:fs/promises')
const { join } = require('node:path')

// Runs on ToDesktop's build servers right before `pnpm install`. By this point
// the CLI has already resolved every `catalog:` reference from the root
// pnpm-workspace.yaml into a concrete version, so versions are read straight off
// pkgJson rather than duplicated here. Add/remove a runtime dependency in
// package.json and it flows through automatically.
module.exports = async ({ pkgJsonPath, pkgJson, appDir }) => {
  // Treat the app as a standalone single-package workspace so install doesn't
  // try to reach back into the monorepo root (which isn't uploaded). electron
  // is the only allowed build — its install script must run to fetch the binary.
  // Everything else is blocked by pnpm's default, so no need to list it.
  await writeFile(
    join(appDir, 'pnpm-workspace.yaml'),
    `packages:
  - .
allowBuilds:
  electron: true
`,
  )

  // The renderer and main process are already compiled into dist-electron, so
  // the workspace packages the CLI copied into bundledPackages aren't needed.
  await rm(join(appDir, 'bundledPackages'), { recursive: true, force: true })

  const unresolved = Object.entries(pkgJson.dependencies ?? {})
    .filter(([, spec]) => typeof spec === 'string' && spec.startsWith('catalog:'))
    .map(([name]) => name)

  if (unresolved.length > 0) {
    throw new Error(
      `Expected the ToDesktop CLI to resolve catalog: versions before this hook, but these are still unresolved: ${unresolved.join(', ')}`,
    )
  }

  // Only electron is required at package time. Drop the rest of devDependencies
  // (build tooling + workspace packages that pointed at the removed bundledPackages).
  const electron = pkgJson.devDependencies?.electron
  pkgJson.devDependencies = electron ? { electron } : {}

  delete pkgJson.optionalDependencies
  delete pkgJson.peerDependencies

  await writeFile(pkgJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`)
}
