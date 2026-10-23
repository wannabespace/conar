import { DEFAULT_SHAPES } from './presets'
import type {
  IconFiles,
  IconsConfig,
  PresetName,
  Shape,
  ShapeName,
} from './types'

export const defineIconsConfig = <
  Source extends string,
  Path extends `${string}.ico` | `${string}.png` = never,
>(config: {
  /** Icons cut from one source, written into a folder as a ready-made set. */
  sets?: Record<string, { preset: PresetName; source: NoInfer<Source> }>
  /** Single files, keyed by path; the extension picks PNG or ICO. */
  files?: IconFiles<NoInfer<Source>, Path>
  /** Prefix of the exported images `pnpm icons <folder>` picks up. */
  importPrefix: string
  /** Overrides for the built-in `square`, `rounded` and `maskable` shapes. */
  shapes?: Partial<Record<ShapeName, Shape>>
  /** Width of the mark in the source images, as a fraction of their size. */
  sourceMarkSize: number
  /** Each source image by name, saved where the next run reads it. */
  sources: Record<Source, `${string}.png`>
}): IconsConfig<Source> => ({
  ...config,
  files: config.files ?? {},
  sets: config.sets ?? {},
  shapes: { ...DEFAULT_SHAPES, ...config.shapes },
})
