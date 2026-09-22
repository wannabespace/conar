import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Plugin, ViteDevServer } from 'vite'

import { PLUGIN_NAME, replaceMarkers } from './utils.ts'

const REACT_PLUGIN_NAME = `${PLUGIN_NAME}:react`

interface InlineReactHtmlOptions {
  components: { marker: string; module: string; export?: string }[]
}

const renderComponents = async (
  root: string,
  server: ViteDevServer | undefined,
  components: InlineReactHtmlOptions['components']
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
      components.map(async ({ marker, module, export: name = 'default' }) => {
        const exports = (await renderer.ssrLoadModule(module)) as Record<
          string,
          React.ComponentType
        >
        const Component = exports[name]

        if (!Component) {
          throw new Error(
            `[${REACT_PLUGIN_NAME}] ${module} has no export "${name}"`
          )
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

export const inlineReactHtml = ({
  components,
}: InlineReactHtmlOptions): Plugin => {
  let root = ''

  return {
    configResolved({ root: resolved }) {
      root = resolved
    },
    name: REACT_PLUGIN_NAME,
    async transformIndexHtml(html, { server }) {
      return replaceMarkers(
        html,
        await renderComponents(root, server, components)
      )
    },
  }
}
