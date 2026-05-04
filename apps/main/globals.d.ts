import type * as React from 'react'

declare module 'react' {
  interface CSSProperties extends React.CSSProperties {
    [key: `--${string}`]: string | number
  }
}
