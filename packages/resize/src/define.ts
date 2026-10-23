import type { CheckedResizeConfig, ResizeConfig } from './types'

export const defineConfig = <const Config extends ResizeConfig>(
  config: Config & CheckedResizeConfig<Config>
): ResizeConfig => config
