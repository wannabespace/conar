import path from 'node:path'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Plugin, ViteDevServer } from 'vite'

const SHELL_MARKER = '<!--shell-->'
const SHELL_MODULE = '/src/shell.tsx'

const appRoot = path.resolve(import.meta.dirname, '..')

const loadShell = async (server?: ViteDevServer) => {
  if (server) {
    return await server.ssrLoadModule(SHELL_MODULE)
  }

  const { createServer } = await import('vite')
  const renderer = await createServer({
    appType: 'custom',
    configFile: false,
    logLevel: 'error',
    root: appRoot,
    server: { middlewareMode: true },
  })

  try {
    return await renderer.ssrLoadModule(SHELL_MODULE)
  } finally {
    await renderer.close()
  }
}

export const prerenderShell = (): Plugin => ({
  name: 'tamery:prerender-shell',
  async transformIndexHtml(html, { server }) {
    const { AppShell, AuthShell } = await loadShell(server)

    return html.replace(
      SHELL_MARKER,
      renderToStaticMarkup(createElement(AppShell)) +
        renderToStaticMarkup(createElement(AuthShell))
    )
  },
})
