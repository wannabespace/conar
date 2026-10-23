export type IconFormat =
  | { size: number; type: 'png' }
  | { sizes: number[]; type: 'ico' }

export interface IconShape {
  cornerRadius?: number
  markWidth: number
}

export interface IconOutput<Source extends string, Shape extends string> {
  file: string
  format: IconFormat
  shape: Shape
  source: Source
}

export interface IconsConfig<Source extends string, Shape extends string> {
  outputs: IconOutput<Source, Shape>[]
  shapes: Record<Shape, IconShape>
  sourceMarkWidth: number
  sourcePrefix: string
  sources: Record<Source, string>
}
