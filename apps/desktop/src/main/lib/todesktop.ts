import { createRequire } from 'node:module'

import type { UpdateChannel } from '@tamery/shared/updates'
import type todesktopRuntime from '@todesktop/runtime'
import Store from 'electron-store'

import betaConfig from '../../../todesktop.beta.json' with { type: 'json' }
import stableConfig from '../../../todesktop.json' with { type: 'json' }

const todesktop = createRequire(import.meta.url)(
  '@todesktop/runtime'
) as typeof todesktopRuntime

todesktop.init()

export const { autoUpdater } = todesktop

const TODESKTOP_APP_IDS: Record<UpdateChannel, string> = {
  beta: betaConfig.id,
  stable: stableConfig.id,
}

const store = new Store<{ channel: UpdateChannel }>({
  defaults: { channel: 'stable' },
  name: 'updates',
})

// electron-updater emits this before it resolves the feed, so the URL set here already applies to the check that emitted it.
autoUpdater?.on('checking-for-update', () => {
  autoUpdater.setFeedURL(
    `https://download.todesktop.com/${TODESKTOP_APP_IDS[store.get('channel')]}`
  )
})

export const updateChannel = () => store.get('channel')

export const setUpdateChannel = (channel: UpdateChannel) => {
  store.set('channel', channel)
  void autoUpdater?.checkForUpdates()
}
