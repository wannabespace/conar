import type { Plugin } from 'vite'

import { PLUGIN_NAME, replaceMarkers } from './utils.ts'

interface InlineHtmlOptions {
  scripts: { marker: string; entry: string }[]
}

const bundleScript = async (root: string, entry: string) => {
  const { build } = await import('vite')
  const result = await build({
    build: {
      lib: { entry, fileName: 'inline', formats: ['iife'], name: 'inline' },
      write: false,
    },
    configFile: false,
    logLevel: 'error',
    root,
  })

  const [bundle] = Array.isArray(result) ? result : [result]
  const chunk = 'output' in bundle ? bundle.output[0] : null

  if (chunk?.type !== 'chunk') {
    throw new Error(`[${PLUGIN_NAME}] ${entry} produced no chunk`)
  }

  return `<script>${chunk.code}</script>`
}

export const inlineHtml = ({ scripts }: InlineHtmlOptions): Plugin => {
  let bundles = new Map<string, Promise<string>>()
  let root = ''

  return {
    configResolved({ root: resolved }) {
      root = resolved
    },
    configureServer(server) {
      server.watcher.on('change', (file) => {
        if (file.startsWith(root)) {
          bundles = new Map()
        }
      })
    },
    name: PLUGIN_NAME,
    async transformIndexHtml(html) {
      const inlined = await Promise.all(
        scripts.map(async ({ marker, entry }) => {
          const code = bundles.get(entry) ?? bundleScript(root, entry)
          bundles.set(entry, code)

          return [marker, await code] as const
        })
      )

      return replaceMarkers(html, inlined)
    },
  }
}
