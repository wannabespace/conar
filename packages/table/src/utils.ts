import type { CSSProperties } from 'react'

const SPACE_DOT_REGEX = /[\s.]+/gu
export const prepareColumnId = (id: string) =>
  id.trim().replace(SPACE_DOT_REGEX, '_')

export const getBaseColumnStyle = ({
  id,
  defaultSize,
}: {
  id: string
  defaultSize: number
}): CSSProperties => ({
  flexShrink: 0,
  height: '100%',
  width: `var(--table-column-width-${prepareColumnId(id)}, ${defaultSize}px)`,
  willChange: 'width',
})
