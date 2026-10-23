import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import { PRESETS } from './presets'
import { CANVAS, encode, renderShape } from './render'
import type { IconsConfig } from './types'

export const generateIcons = async <Source extends string>(
  {
    files,
    importPrefix,
    sets,
    shapes,
    sourceMarkSize,
    sources,
  }: IconsConfig<Source>,
  { importDir, root }: { importDir: string | null; root: string }
) => {
  const imported = importDir ? await readdir(importDir) : []

  const readSource = (name: string, savedFile: string) => {
    const prefix = `${importPrefix}${name}-`
    const largest = imported
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
    if (!importDir || !largest) {
      return readFile(path.join(root, savedFile))
    }
    return sharp(path.join(importDir, largest.file))
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
  const loadSource = (name: Source) =>
    once(name, () => readSource(name, sources[name]))

  const outputs = {
    ...Object.fromEntries(
      Object.entries(sets).flatMap(([folder, { preset, source }]) =>
        Object.entries(PRESETS[preset](source)).map(([name, file]) => [
          path.join(folder, name),
          file,
        ])
      )
    ),
    ...files,
  }

  const rendered = [
    ...Object.entries<`${string}.png`>(sources).map(async ([name, file]) => ({
      buffer: await once(name, () => readSource(name, file)),
      file,
    })),
    ...Object.entries(outputs).map(async ([file, output]) => {
      const shaped = await once(`${output.source}:${output.shape}`, async () =>
        renderShape(
          await loadSource(output.source),
          sourceMarkSize,
          shapes[output.shape]
        )
      )
      return { buffer: await encode(shaped, output), file }
    }),
  ]

  return Promise.all(
    rendered.map(async (pending) => {
      const { buffer, file } = await pending
      await mkdir(path.dirname(path.join(root, file)), { recursive: true })
      await writeFile(path.join(root, file), buffer)
      return file
    })
  )
}
