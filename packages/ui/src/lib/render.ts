import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'

export const render = (component: React.ReactNode) => {
  const div = document.createElement('div')
  const root = createRoot(div)

  root.render(component)

  return div
}

export const renderWithRoot = (
  component: React.ReactNode
): {
  domNode: HTMLDivElement
  root: Root
} => {
  const domNode = document.createElement('div')
  const root = createRoot(domNode)

  root.render(component)

  return { domNode, root }
}
