import type { MDXProps } from 'mdx/types'
import type { ComponentType } from 'react'

const modules = import.meta.glob<{ default: ComponentType<MDXProps> }>(
  './content/*.mdx',
  { eager: true }
)

export const postBodies: Record<
  string,
  ComponentType<MDXProps>
> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [
    path.slice('./content/'.length, -'.mdx'.length),
    mod.default,
  ])
)
