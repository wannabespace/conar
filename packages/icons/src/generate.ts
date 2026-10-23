import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import { CANVAS, encode, renderShape } from './render'
import type { IconsConfig } from './types'

export const generateIcons = async <
  Source extends string,
  Shape extends string,
>(
  {
    outputs,
    shapes,
    sourceMarkWidth,
    sourcePrefix,
    sources,
  }: IconsConfig<Source, Shape>,
  { root, sourceDir }: { root: string; sourceDir: string | null }
) => {
  const sourceFiles = sourceDir ? await readdir(sourceDir) : []

  const readSource = (name: string, savedFile: string) => {
    const prefix = `${sourcePrefix}${name}-`
    const largest = sourceFiles
      .filter(
        (file) => file.startsWith(prefix) && path.extname(file) === '.png'
      )
      .map((file) => ({
        file,
        size: Number(path.parse(file).name.slice(prefix.length)),
      }))
      .filter(({ size }) => Number.isInteger(size))
      .toSorted((a, b) => b.size - a.size)
      .at(0)
    if (!sourceDir || !largest) {
      return readFile(path.join(root, savedFile))
    }
    return sharp(path.join(sourceDir, largest.file))
      .resize(CANVAS, CANVAS)
      .png({ compressionLevel: 9 })
      .toBuffer()
  }

  const renders = new Map<string, Promise<Buffer>>()
  const once = (key: string, render: () => Promise<Buffer>) => {
    const pending = renders.get(key) ?? render()
    renders.set(key, pending)
    return pending
  }
  const loadSource = (name: string, file: string) =>
    once(name, () => readSource(name, file))

  const files = [
    ...Object.entries<string>(sources).map(async ([name, file]) => ({
      buffer: await loadSource(name, file),
      file,
    })),
    ...outputs.map(async ({ file, format, shape, source }) => {
      const shaped = await once(`${source}:${shape}`, async () =>
        renderShape(
          await loadSource(source, sources[source]),
          sourceMarkWidth,
          shapes[shape]
        )
      )
      return { buffer: await encode(shaped, format), file }
    }),
  ]

  return Promise.all(
    files.map(async (pending) => {
      const { buffer, file } = await pending
      await mkdir(path.dirname(path.join(root, file)), { recursive: true })
      await writeFile(path.join(root, file), buffer)
      return file
    })
  )
}
