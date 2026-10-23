export type IcoSize = 16 | 24 | 32 | 48 | 64 | 128 | 256

export interface IconShape {
  cornerRadius?: number
  markWidth: number
}

export type IconOutput<Source extends string, Shape extends string> = {
  shape: Shape
  source: Source
} & (
  | { file: `${string}.png`; format: { size: number; type: 'png' } }
  | {
      file: `${string}.ico`
      format: { sizes: [IcoSize, ...IcoSize[]]; type: 'ico' }
    }
)

export type IconFormat = IconOutput<string, string>['format']

export interface IconsConfig<Source extends string, Shape extends string> {
  outputs: IconOutput<Source, Shape>[]
  shapes: Record<Shape, IconShape>
  sourceMarkWidth: number
  sourcePrefix: string
  sources: Record<Source, `${string}.png`>
}
