import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Plugin, ViteDevServer } from 'vite'

interface PrerenderOptions {
  components?: { marker: string; module: string; export: string }[]
  scripts?: { marker: string; entry: string }[]
}

const PLUGIN_NAME = 'tamery:prerender'

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

const renderComponents = async (
  root: string,
  server: ViteDevServer | undefined,
  components: NonNullable<PrerenderOptions['components']>
) => {
  const { createServer } = await import('vite')
  const renderer =
    server ??
    (await createServer({
      appType: 'custom',
      configFile: false,
      logLevel: 'error',
      root,
      server: { middlewareMode: true },
    }))

  try {
    return await Promise.all(
      components.map(async ({ marker, module, export: name }) => {
        const exports = (await renderer.ssrLoadModule(module)) as Record<
          string,
          React.ComponentType
        >
        const Component = exports[name]

        if (!Component) {
          throw new Error(`[${PLUGIN_NAME}] ${module} has no export "${name}"`)
        }

        return [marker, renderToStaticMarkup(createElement(Component))] as const
      })
    )
  } finally {
    if (renderer !== server) {
      await renderer.close()
    }
  }
}

export const prerender = ({
  components = [],
  scripts = [],
}: PrerenderOptions = {}): Plugin => {
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
    async transformIndexHtml(html, { server }) {
      const inlined = await Promise.all(
        scripts.map(async ({ marker, entry }) => {
          const code = bundles.get(entry) ?? bundleScript(root, entry)
          bundles.set(entry, code)

          return [marker, await code] as const
        })
      )
      const rendered =
        components.length > 0
          ? await renderComponents(root, server, components)
          : []

      let result = html

      for (const [marker, markup] of [...inlined, ...rendered]) {
        result = result.replace(marker, markup)
      }

      return result
    },
  }
}
