import type { ComponentProps } from 'react'
import { useId } from 'react'

export function SQLiteIcon(props: ComponentProps<'svg'>) {
  const id = `sqlite-${useId().replaceAll(':', '')}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...props}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#004B6B" />
          <stop offset="50%" stopColor="#003B57" />
          <stop offset="100%" stopColor="#002A3D" />
        </linearGradient>
      </defs>
      <ellipse cx="128" cy="52" fill={`url(#${id})`} rx="76" ry="30" />
      <path
        fill={`url(#${id})`}
        d="M204 52v152c0 16.6-34 30-76 30s-76-13.4-76-30V52c0 16.6 34 30 76 30s76-13.4 76-30z"
      />
      <ellipse cx="128" cy="204" fill={`url(#${id})`} rx="76" ry="30" />
    </svg>
  )
}
