import type * as React from 'react'

declare module 'react' {
  type CSSProperties = React.CSSProperties &
    Record<`--${string}`, string | number>
}
