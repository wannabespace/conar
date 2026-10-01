import { readFileSync } from 'node:fs'
import path from 'node:path'

// `src` is an app's `src/` folder: modules live in `src/modules/<name>/` and
// `~/` resolves to `src/`.
export const moduleBoundaryViolations = (src: string) => {
  // The route tree is regenerated from the folders, so it may import any module.
  const files = [...new Bun.Glob('**/*.{ts,tsx}').scanSync(src)].filter(
    (file) => file !== 'routeTree.gen.ts'
  )

  const moduleOf = (file: string) => {
    const [top, name] = path.relative(src, file).split('/')
    return top === 'modules' ? name : null
  }

  const importsOf = (file: string) =>
    [
      ...readFileSync(path.resolve(src, file), 'utf-8').matchAll(
        /(?:from|import)\s*\(?\s*'(?<specifier>[~.][^']*)'/gu
      ),
    ].map(({ groups: { specifier = '' } = {} }) =>
      specifier.startsWith('~/')
        ? path.resolve(src, specifier.slice(2))
        : path.resolve(src, path.dirname(file), specifier)
    )

  return files.flatMap((file) =>
    importsOf(file)
      .filter((target) => {
        const owner = moduleOf(path.resolve(src, file))
        const imported = moduleOf(target)
        return imported !== null && imported !== owner
      })
      .map((target) => `${file} -> ${path.relative(src, target)}`)
  )
}
