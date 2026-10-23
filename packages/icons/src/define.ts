import type { IconOutput, IconsConfig } from './types'

export const defineIconsConfig = <Source extends string, Shape extends string>(
  config: Omit<IconsConfig<Source, Shape>, 'outputs'> & {
    outputs: IconOutput<NoInfer<Source>, NoInfer<Shape>>[]
  }
): IconsConfig<Source, Shape> => config
