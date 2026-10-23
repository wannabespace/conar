import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import { DEFAULT_SHAPES, PRESETS } from './presets'
import { CANVAS, encode, renderShape } from './render'
import type { Icon, IconsConfig } from './types'

const findLatestExport = (
  exported: string[],
  importPattern: string,
  image: string
) => {
  const [before = '', after = ''] = importPattern
    .replace('{image}', image)
    .split('{size}')
  return exported
    .filter((file) => file.startsWith(before) && file.endsWith(after))
    .map((file) => ({
      file,
      size: Number(file.slice(before.length, file.length - after.length)),
    }))
    .filter(({ size }) => Number.isInteger(size))
    .toSorted((a, b) => b.size - a.size)
    .at(0)?.file
}

export const generateIcons = async (
  { images, importPattern, shapes }: IconsConfig,
  { importDir, root }: { importDir: string | null; root: string }
) => {
  const exported = importDir ? await readdir(importDir) : []
  const allShapes = { ...DEFAULT_SHAPES, ...shapes }

  const files = Object.entries(images).flatMap(([name, image]) => {
    const latest = findLatestExport(exported, importPattern, name)
    const source =
      importDir && latest
        ? sharp(path.join(importDir, latest))
            .resize(CANVAS, CANVAS)
            .png({ compressionLevel: 9 })
            .toBuffer()
        : readFile(path.join(root, image.file))

    const icons = Object.entries(image.to).flatMap(
      ([target, icon]): [string, Icon][] =>
        typeof icon === 'string'
          ? Object.entries(PRESETS[icon]).map(([file, preset]) => [
              path.join(target, file),
              preset,
            ])
          : [[target, icon]]
    )

    const shaped = new Map<string, Promise<Buffer>>()
    const shape = (shapeName: Icon['shape']) => {
      const pending =
        shaped.get(shapeName) ??
        (async () =>
          renderShape(await source, image.markSize, allShapes[shapeName]))()
      shaped.set(shapeName, pending)
      return pending
    }

    return [
      { buffer: source, file: image.file },
      ...icons.map(([file, icon]) => ({
        buffer: (async () => encode(await shape(icon.shape), icon))(),
        file,
      })),
    ]
  })

  const repeated = files.find(
    ({ file }, index) =>
      files.findIndex((other) => other.file === file) !== index
  )
  if (repeated) {
    throw new Error(`${repeated.file} is written by more than one image`)
  }

  return Promise.all(
    files.map(async ({ buffer, file }) => {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true })
      await writeFile(path.join(root, file), await buffer)
      return file
    })
  )
}
