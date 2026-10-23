export type IcoSize = 16 | 24 | 32 | 48 | 64 | 128 | 256

export type ShapeName = 'maskable' | 'rounded' | 'square' | 'squircle'

export interface Shape {
  /**
   * Corner radius as a fraction of the icon size, or `'squircle'` for the
   * continuous-corner superellipse macOS and iOS use; omit for square corners.
   */
  corners?: number | 'squircle'
  /** How wide the mark is in the icon, as a fraction of the icon size. */
  markSize: number
}

/** `web`: favicons, apple-touch and manifest icons. `all`: `web` plus 1024 px tiles and a logo. */
export type PresetName = 'all' | 'web'

export interface PngIcon {
  shape: ShapeName
  size: number
}

export interface IcoIcon {
  shape: ShapeName
  sizes: readonly [IcoSize, ...IcoSize[]]
}

export type Icon = IcoIcon | PngIcon

export interface ImageConfig {
  /** Where the image is kept; `pnpm icons <folder>` replaces it with a newer export. */
  file: `${string}.png`
  /** How wide the mark is in this image, as a fraction of the image size. */
  markSize: number
  /**
   * Where the image is converted to. A folder gets a preset set of icons;
   * a `.png` file takes `{ shape, size }`, an `.ico` file `{ shape, sizes }`.
   */
  to: Record<string, Icon | PresetName>
}

export interface IconsConfig {
  /** The artwork every icon is cut from, each with the places it goes. */
  images: Record<string, ImageConfig>
  /** File name of a new export `pnpm icons <folder>` looks for; the largest `{size}` wins. */
  importPattern: `${string}{image}${string}{size}${string}`
  /** Overrides for the built-in `square`, `rounded`, `squircle` and `maskable`. */
  shapes?: Partial<Record<ShapeName, Shape>>
}

type CheckedTargets<Targets> = {
  [Target in keyof Targets]: Target extends `${string}.ico`
    ? IcoIcon
    : Target extends `${string}.png`
      ? PngIcon
      : PresetName
}

export interface CheckedIconsConfig<Config extends IconsConfig> {
  images: {
    [Name in keyof Config['images']]: {
      to: CheckedTargets<Config['images'][Name]['to']>
    }
  }
}
