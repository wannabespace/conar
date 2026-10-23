export type IcoSize = 16 | 24 | 32 | 48 | 64 | 128 | 256

export type ShapeName = 'maskable' | 'rounded' | 'square' | 'squircle'

export interface Shape {
  /**
   * Corner radius as a fraction of the icon size, or `'squircle'` for the
   * continuous-corner superellipse macOS and iOS use; omit for square corners.
   */
  corners?: number | 'squircle'
  /** Width of the mark as a fraction of the icon size. */
  markSize: number
}

export type PresetName = 'brand' | 'web'

interface PngFile<Source extends string> {
  shape: ShapeName
  size: number
  source: Source
}

interface IcoFile<Source extends string> {
  shape: ShapeName
  sizes: [IcoSize, ...IcoSize[]]
  source: Source
}

export type IconFile<Source extends string> = IcoFile<Source> | PngFile<Source>

export type IconFiles<Source extends string, Path extends string> = {
  [File in Path]: File extends `${string}.ico`
    ? IcoFile<Source>
    : PngFile<Source>
}

export interface IconsConfig<Source extends string> {
  files: Record<string, IconFile<Source>>
  importPrefix: string
  sets: Record<string, { preset: PresetName; source: Source }>
  shapes: Record<ShapeName, Shape>
  sourceMarkSize: number
  sources: Record<Source, `${string}.png`>
}
