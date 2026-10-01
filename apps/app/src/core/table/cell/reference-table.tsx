import { workspaceModules } from '~/lib/workspace-modules'

export const ReferenceTable = (props: {
  column: string
  schema: string
  table: string
  value: unknown
}) => {
  const Component = workspaceModules.referenceTable

  return Component ? <Component {...props} /> : null
}
