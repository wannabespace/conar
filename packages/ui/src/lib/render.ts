import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

// https://react.dev/reference/react-dom/server/renderToString#removing-rendertostring-from-the-client-code
export function render(component: React.ReactNode) {
  const div = document.createElement('div')
  const root = createRoot(div)

  // eslint-disable-next-line react-dom/no-flush-sync
  flushSync(() => {
    root.render(component)
  })

  return div
}
