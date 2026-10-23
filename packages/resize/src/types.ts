export type IcoSize = 16 | 24 | 32 | 48 | 64 | 128 | 256

export interface Transform {
  /** `round` cuts the corners with a 22% radius, `squircle` with the macOS continuous curve. */
  corners?: 'round' | 'squircle'
  /** Crops the edges and scales the rest up; `1.2` makes the content 20% larger. */
  zoom?: number
}

export interface PngOutput extends Transform {
  size: number
}

export interface IcoOutput extends Transform {
  sizes: readonly [IcoSize, ...IcoSize[]]
}

export interface ManifestOutput {
  /** PNG files of the same folder to list, with their `purpose`; sizes come from their outputs. */
  icons: Record<`${string}.png`, 'any' | 'maskable'>
  /** Every other manifest field, written as is. */
  manifest: Record<string, unknown>
}

export interface Files {
  [file: `${string}.ico`]: IcoOutput
  [file: `${string}.png`]: PngOutput
  [file: `${string}.webmanifest`]: ManifestOutput
}

export interface ResizeConfig {
  /** Each source image, then each folder with the files made from it. */
  images: Record<string, Record<string, Files>>
  /** Zoom for every output that does not set its own. */
  zoom?: number
}
