import type { CheckedIconsConfig, IconsConfig } from './types'

export const defineIconsConfig = <const Config extends IconsConfig>(
  config: Config & CheckedIconsConfig<Config>
): IconsConfig => config
