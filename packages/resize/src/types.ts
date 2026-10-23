export type IcoSize = 16 | 24 | 32 | 48 | 64 | 128 | 256

export type ImageFile = `${string}.${'jpg' | 'png' | 'webp'}`

interface Transform {
  /** `round` cuts the corners with a 22% radius, `squircle` with the macOS continuous curve. */
  corners?: 'round' | 'squircle'
  /** Crops the edges and scales the rest up; `1.2` makes the content 20% larger. */
  zoom?: number
}

export interface ImageOutput extends Transform {
  size: number
}

export interface IcoOutput extends Transform {
  sizes: readonly [IcoSize, ...IcoSize[]]
}

export type Output = IcoOutput | ImageOutput

/** A file path with its output, or a folder with the files it gets. */
export type Targets = Record<string, Output | Record<string, Output>>

export interface ResizeConfig {
  /** Each source image with the files made from it. */
  images: Record<ImageFile, Targets>
  /** Zoom for every output that does not set its own. */
  zoom?: number
}

type CheckedFile<File> = File extends `${string}.ico`
  ? IcoOutput
  : File extends ImageFile
    ? ImageOutput
    : never

type CheckedTarget<Target, Value> = Target extends `${string}.ico` | ImageFile
  ? CheckedFile<Target>
  : { [File in keyof Value]: CheckedFile<File> }

export interface CheckedResizeConfig<Config extends ResizeConfig> {
  images: {
    [Image in keyof Config['images']]: {
      [Target in keyof Config['images'][Image]]: CheckedTarget<
        Target,
        Config['images'][Image][Target]
      >
    }
  }
}
