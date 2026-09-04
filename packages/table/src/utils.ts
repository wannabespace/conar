import type { CSSProperties } from 'react'

const SPACE_DOT_REGEX = /[\s.]+/gu
export const prepareColumnId = (id: string) =>
  id.trim().replace(SPACE_DOT_REGEX, '_')

export const columnWidth = {
  remove: (element: HTMLElement, id: string) => {
    element.style.removeProperty(columnWidth.variable(id))
  },
  set: (element: HTMLElement, id: string, width: number) => {
    element.style.setProperty(columnWidth.variable(id), `${width}px`)
  },
  variable: (id: string) => `--table-column-width-${prepareColumnId(id)}`,
}

export const getBaseColumnStyle = ({
  id,
  defaultSize,
}: {
  id: string
  defaultSize: number
}): CSSProperties => ({
  flexShrink: 0,
  height: '100%',
  width: `var(${columnWidth.variable(id)}, ${defaultSize}px)`,
  willChange: 'width',
})
