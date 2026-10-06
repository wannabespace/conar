// bun --watch ignores node_modules, so a dev server that crashed on a not-yet-installed package never restarts on its own; the root postinstall rewrites this stamp to restart it
const installStamp = `${import.meta.dir}/../.turbo/installed-at.txt`

if (!(await Bun.file(installStamp).exists())) {
  await Bun.write(installStamp, '')
}

await import(installStamp)
