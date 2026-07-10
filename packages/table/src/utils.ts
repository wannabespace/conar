import type { CSSProperties } from 'react'

const SPACE_DOT_REGEX = /[\s.]+/g
export function prepareColumnId(id: string) {
  return id.trim().replace(SPACE_DOT_REGEX, '_')
}

export function getBaseColumnStyle({ id, defaultSize }: { id: string, defaultSize: number }): CSSProperties {
  return {
    width: `var(--table-column-width-${prepareColumnId(id)}, ${defaultSize}px)`,
    height: '100%',
    flexShrink: 0,
    willChange: 'width',
  }
}
