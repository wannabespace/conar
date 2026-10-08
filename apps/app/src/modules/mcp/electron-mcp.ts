// Undefined on the web build, where protected.tsx registers none of this module's mounts or settings: read it only from code they reach.
export const mcp = window.electron?.mcp as NonNullable<
  Window['electron']
>['mcp']

export const statusQueryKey = ['mcp', 'status']
