import { createRequire } from 'node:module'

import type todesktopRuntime from '@todesktop/runtime'

const todesktop = createRequire(import.meta.url)(
  '@todesktop/runtime'
) as typeof todesktopRuntime

todesktop.init()

export const { autoUpdater } = todesktop
